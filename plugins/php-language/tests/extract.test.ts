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
  it("extracts declarations, inheritance, methods, and imports from the CST", () => {
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
    expect(result.nodes.find((item) => item.canonicalID === "Vendor\\Package")).toBeTruthy()
    expect(result.nodes.find((item) => item.label === "Catalog")?.properties.extends).toBe("BaseCatalog")
  })

  it("never invents declarations when a grammar tree is unavailable", () => {
    expect(extract("src/catalog.php", "function invented() {}", null).nodes).toHaveLength(1)
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
      .toBe("boundaries.php:Demo\\Store:function:demo_update_cart")
  })

  it("uses the recognized namespace declaration text when no name child is serialized", () => {
    const tree = node("program", "", null, [
      node("namespace_definition", "namespace Demo\\Store;", null, [
        node("declaration_list", "", "body", [node("function_definition", "", null, [node("name", "demo_update_cart", "name")])]),
      ]),
    ])
    const result = extract("boundaries.php", "<?php", tree)
    expect(result.nodes.find((item) => item.type === "symbol")?.canonicalID)
      .toBe("boundaries.php:Demo\\Store:function:demo_update_cart")
  })

  it("uses a bare namespace token carried by the recognized declaration node", () => {
    const tree = node("program", "", null, [
      node("namespace_definition", "Demo\\Store", null, [
        node("declaration_list", "", "body", [node("function_definition", "", null, [node("name", "demo_update_cart", "name")])]),
      ]),
    ])
    const result = extract("boundaries.php", "<?php", tree)
    expect(result.nodes.find((item) => item.type === "symbol")?.canonicalID)
      .toBe("boundaries.php:Demo\\Store:function:demo_update_cart")
  })

  it("falls back to the in-scope source namespace when the serialized CST has no wrapper", () => {
    const declaration = node("function_definition", "", null, [node("name", "demo_update_cart", "name")])
    declaration.startByte = "<?php\nnamespace Demo\\Store;\n".length
    const tree = node("program", "", null, [declaration])
    const content = "<?php\nnamespace Demo\\Store;\nfunction demo_update_cart() {}"
    const result = extract("boundaries.php", content, tree)
    expect(result.nodes.find((item) => item.type === "symbol")?.canonicalID)
      .toBe("boundaries.php:Demo\\Store:function:demo_update_cart")
  })
})
