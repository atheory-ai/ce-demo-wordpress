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
})
