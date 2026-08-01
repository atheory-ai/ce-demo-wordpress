import { describe, expect, it } from "vitest"
import { extract } from "../src/extract.js"
import type { SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

Object.assign(globalThis, {
  __ce_node_id: (_projectID: string, type: string, canonicalID: string) => `${type}:${canonicalID}`,
  __ce_edge_id: (sourceID: string, type: string, targetID: string) => `${sourceID}:${type}:${targetID}`,
})

function node(type: string, text = "", fieldName: string | null = null, children: SyntaxNode[] = []): SyntaxNode {
  return { type, text, fieldName, isNamed: true, startByte: 0, endByte: 0, startPosition: { row: 0, column: 0 }, endPosition: { row: 0, column: 0 }, children }
}

describe("PHP structural extraction", () => {
  it("extracts declarations, inheritance, methods, and raw namespace references from the CST", () => {
    const tree = node("program", "", null, [
      node("namespace_use_declaration", "", null, [node("namespace_use_clause", "", null, [node("qualified_name", "Vendor\\Package")])]),
      node("class_declaration", "", null, [
        node("name", "Catalog", "name"),
        node("base_clause", "", null, [node("qualified_name", "BaseCatalog")]),
        node("declaration_list", "", "body", [node("method_declaration", "", null, [node("name", "register", "name"), node("visibility_modifier", "public")])]),
      ]),
      node("function_definition", "", null, [node("name", "bootstrap", "name")]),
    ])
    const result = extract("src/catalog.php", "<?php", tree)
    expect(result.nodes.filter((item) => item.type === "symbol").map((item) => item.label)).toEqual(expect.arrayContaining(["Catalog", "Catalog.register", "bootstrap"]))
    expect(result.evidence?.references?.find((item) => item.raw_specifier === "Vendor\\Package")?.space).toBe("namespace")
    expect(result.nodes.find((item) => item.label === "Catalog")?.properties.extends).toBe("BaseCatalog")
    expect(result.evidence?.semantics?.[0]).toMatchObject({
      kind: "language.class_heritage",
      entity_kind: "php.class",
      entity_key: "src/catalog.php:Catalog",
      relationships: [{ relation: "extends", status: "unresolved", expression: "BaseCatalog" }],
    })
  })

  it("emits static include evidence and leaves computed includes dynamic", () => {
    const include = node("require_expression", "require __DIR__ . '/bootstrap.php';")
    const computed = node("require_expression", "$loader($path)")
    const result = extract("src/index.php", "<?php", node("program", "", null, [include, computed]))
    const staticReference = result.evidence?.references?.find((item) => item.import_form === "require" && item.kind === "relative_path")
    expect(staticReference?.space).toBe("file")
    expect(staticReference?.static_candidates).toEqual(["./bootstrap.php"])
    const dynamicReference = result.evidence?.references?.find((item) => item.import_form === "require" && item.kind === "dynamic")
    expect(dynamicReference).toBeTruthy()
  })

  it("preserves grouped and aliased namespace-use references", () => {
    const grouped = node("namespace_use_declaration", "use Demo\\Domain\\{Order, Cart as CartAlias};", null, [
      node("namespace_use_group", "", null, [
        node("namespace_use_clause", "", null, [node("qualified_name", "Order")]),
        node("namespace_use_clause", "", null, [node("qualified_name", "Cart"), node("name", "CartAlias", "alias")]),
      ]),
    ])
    const result = extract("src/index.php", "<?php", node("program", "", null, [grouped]))
    expect(result.evidence?.references?.map((item) => item.raw_specifier))
      .toEqual(expect.arrayContaining(["Demo\\Domain\\Order", "Demo\\Domain\\Cart"]))
  })

  it("never invents declarations when a grammar tree is unavailable", () => {
    expect(extract("src/catalog.php", "function invented() {}", null).nodes).toHaveLength(1)
  })

  it("preserves direct function calls for host-owned resolution", () => {
    const call = node("function_call_expression", "helper()", null, [node("name", "helper", "function")])
    const caller = node("function_definition", "", null, [
      node("name", "run", "name"),
      node("compound_statement", "", "body", [call]),
    ])
    const callee = node("function_definition", "", null, [node("name", "helper", "name")])
    const result = extract("src/calls.php", "<?php", node("program", "", null, [caller, callee]))
    expect(result.evidence?.calls?.[0]).toMatchObject({
      callee_expression: "helper",
      kind: "local",
      candidate_names: ["helper"],
    })
    expect(result.evidence?.call_scopes).toHaveLength(2)
    expect(result.edges.some((item) => item.type === "calls")).toBe(false)
  })

  it("preserves static class calls through a use alias for host resolution", () => {
    const use = node("namespace_use_declaration", "use Demo\\Service as ServiceAlias;", null, [
      node("namespace_use_clause", "", null, [node("qualified_name", "Demo\\Service"), node("name", "ServiceAlias", "alias")]),
    ])
    const call = node("scoped_call_expression", "ServiceAlias::handle()", null, [
      node("name", "ServiceAlias", "scope"),
      node("name", "handle", "name"),
    ])
    const caller = node("function_definition", "", null, [
      node("name", "run", "name"), node("compound_statement", "", "body", [call]),
    ])
    const result = extract("src/calls.php", "<?php", node("program", "", null, [use, caller]))
    expect(result.evidence?.calls?.[0]).toMatchObject({
      kind: "imported",
      reference_specifier: "Demo\\Service",
      candidate_names: ["Service.handle"],
    })
    expect(result.evidence?.references?.[0]?.bindings)
      .toEqual([{ localName: "ServiceAlias", remoteName: "Service" }])
  })

  it("keeps same-named use aliases isolated across namespace scopes", () => {
    const namespace = (name: string, target: string): SyntaxNode => node("namespace_definition", "", null, [
      node("name", name, "name"),
      node("declaration_list", "", "body", [
        node("namespace_use_declaration", `use ${target} as Service;`, null, [
          node("namespace_use_clause", "", null, [node("qualified_name", target), node("name", "Service", "alias")]),
        ]),
        node("function_definition", "", null, [
          node("name", "run", "name"),
          node("compound_statement", "", "body", [
            node("scoped_call_expression", "Service::handle()", null, [
              node("name", "Service", "scope"),
              node("name", "handle", "name"),
            ]),
          ]),
        ]),
      ]),
    ])
    const result = extract("src/namespaces.php", "<?php", node("program", "", null, [
      namespace("Demo\\One", "Vendor\\One\\Service"),
      namespace("Demo\\Two", "Vendor\\Two\\Service"),
    ]))
    expect(result.evidence?.calls?.map((call) => call.reference_specifier))
      .toEqual(["Vendor\\One\\Service", "Vendor\\Two\\Service"])
  })

  it("keeps root-level and same-named declarations in separate file identities", () => {
    const declaration = node("program", "", null, [node("function_definition", "", null, [node("name", "bootstrap", "name")])])
    const root = extract("bootstrap.php", "<?php", declaration)
    const first = extract("plugins/first.php", "<?php", declaration)
    const second = extract("plugins/second.php", "<?php", declaration)

    const rootSymbol = root.nodes.find((item) => item.type === "symbol")
    const firstSymbol = first.nodes.find((item) => item.type === "symbol")
    const secondSymbol = second.nodes.find((item) => item.type === "symbol")
    expect(rootSymbol?.canonicalID).toBe("bootstrap.php:global:function:bootstrap")
    expect(firstSymbol?.id).not.toBe(secondSymbol?.id)
    expect(first.edges.find((item) => item.type === "defines")?.targetID).toBe(firstSymbol?.id)
    expect(second.edges.find((item) => item.type === "defines")?.targetID).toBe(secondSymbol?.id)
  })

  it("includes namespace context in structural symbol identities", () => {
    const namespaced = (namespaceName: string): SyntaxNode => node("program", "", null, [
      node("namespace_definition", "", null, [
        node("name", namespaceName, "name"),
        node("declaration_list", "", "body", [node("function_definition", "", null, [node("name", "bootstrap", "name")])]),
      ]),
    ])

    const first = extract("plugins/bootstrap.php", "<?php", namespaced("Demo\\One"))
    const second = extract("plugins/bootstrap.php", "<?php", namespaced("Demo\\Two"))
    expect(first.nodes.find((item) => item.type === "symbol")?.id).not.toBe(second.nodes.find((item) => item.type === "symbol")?.id)
  })

  it("preserves a fieldless PHP namespace_name child in symbol identity", () => {
    const tree = node("program", "", null, [
      node("namespace_definition", "", null, [
        node("namespace_name", "Demo\\Store"),
        node("declaration_list", "", "body", [node("function_definition", "", null, [node("name", "demo_update_cart", "name")])]),
      ]),
    ])

    const result = extract("boundaries.php", "<?php", tree)
    expect(result.nodes.find((item) => item.type === "symbol")?.canonicalID)
      .toBe("Demo\\Store:function:demo_update_cart")
  })

  it("uses the recognized namespace declaration text when no name child is serialized", () => {
    const tree = node("program", "", null, [
      node("namespace_definition", "namespace Demo\\Store;", null, [
        node("declaration_list", "", "body", [node("function_definition", "", null, [node("name", "demo_update_cart", "name")])]),
      ]),
    ])
    const result = extract("boundaries.php", "<?php", tree)
    expect(result.nodes.find((item) => item.type === "symbol")?.canonicalID)
      .toBe("Demo\\Store:function:demo_update_cart")
  })

  it("uses a bare namespace token carried by the recognized declaration node", () => {
    const tree = node("program", "", null, [
      node("namespace_definition", "Demo\\Store", null, [
        node("declaration_list", "", "body", [node("function_definition", "", null, [node("name", "demo_update_cart", "name")])]),
      ]),
    ])
    const result = extract("boundaries.php", "<?php", tree)
    expect(result.nodes.find((item) => item.type === "symbol")?.canonicalID)
      .toBe("Demo\\Store:function:demo_update_cart")
  })

  it("falls back to the in-scope source namespace when the serialized CST has no wrapper", () => {
    const declaration = node("function_definition", "", null, [node("name", "demo_update_cart", "name")])
    declaration.startByte = "<?php\nnamespace Demo\\Store;\n".length
    const tree = node("program", "", null, [declaration])
    const content = "<?php\nnamespace Demo\\Store;\nfunction demo_update_cart() {}"
    const result = extract("boundaries.php", content, tree)
    expect(result.nodes.find((item) => item.type === "symbol")?.canonicalID)
      .toBe("Demo\\Store:function:demo_update_cart")
  })
})
