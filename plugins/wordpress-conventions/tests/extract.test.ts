import { describe, expect, it } from "vitest"
import { extract } from "../src/extract.js"
import type { SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

Object.assign(globalThis, {
  __ce_node_id: (_projectID: string, type: string, canonicalID: string) => `${type}:${canonicalID}`,
  __ce_edge_id: (sourceID: string, type: string, targetID: string) => `${sourceID}:${type}:${targetID}`,
})

function node(type: string, text = "", fieldName: string | null = null, children: SyntaxNode[] = []): SyntaxNode {
  return { type, text, fieldName, isNamed: true, startByte: 12, endByte: 24, startPosition: { row: 2, column: 0 }, endPosition: { row: 2, column: 12 }, children }
}

function call(name: string, args: SyntaxNode[]): SyntaxNode {
  return node("function_call_expression", "", null, [node("name", name, "function"), node("arguments", "", "arguments", args)])
}

describe("WordPress convention extraction", () => {
  it("models hooks, REST routes, and blocks from function-call CST nodes", () => {
    const tree = node("program", "", null, [
      call("add_action", [node("string", "'woocommerce_checkout_process'"), node("name", "validate_checkout")]),
      call("register_rest_route", [node("string", "'store/v1'"), node("string", "'/products'")]),
      call("register_block_type", [node("string", "'demo/catalog'")]),
    ])
    const nodes = extract("plugins/catalog.php", "", tree).nodes
    expect(nodes.map((item) => item.type)).toEqual(expect.arrayContaining(["wordpress_hook", "wordpress_route", "wordpress_block"]))
    expect(nodes.find((item) => item.type === "wordpress_hook")?.properties).toMatchObject({ family: "woocommerce", direction: "registration" })
  })

  it("does not create framework facts without a parsed tree", () => {
    expect(extract("plugins/catalog.php", "add_action('x', 'y')", null).nodes).toEqual([])
  })

  it("uses PHP's named call children when grammar field names are unavailable", () => {
    const tree = node("program", "", null, [
      node("function_call_expression", "", null, [
        node("name", "do_action"),
        node("arguments", "", null, [node("string", "'demo_ready'")]),
      ]),
    ])
    expect(extract("plugins/catalog.php", "", tree).nodes).toHaveLength(1)
  })

  it("unwraps the pinned PHP grammar's argument nodes", () => {
    const tree = node("program", "", null, [
      call("apply_filters", [node("argument", "", null, [node("string", "'demo_value'")])]),
    ])
    expect(extract("plugins/catalog.php", "", tree).nodes[0]?.label).toBe("demo_value")
  })
})
