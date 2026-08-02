import { describe, expect, it } from "vitest"
import type { SyntaxNode } from "@atheory-ai/ce-plugin-sdk"
import { extract } from "../src/extract.js"
import { match } from "../src/match.js"

Object.assign(globalThis, {
  __ce_node_id: (_projectID: string, type: string, canonicalID: string) => `${type}:${canonicalID}`,
  __ce_edge_id: (sourceID: string, type: string, targetID: string) => `${sourceID}:${type}:${targetID}`,
})

function node(type: string, text = "", fieldName: string | null = null, children: SyntaxNode[] = []): SyntaxNode {
  return { type, text, fieldName, isNamed: true, startByte: 12, endByte: 24, startPosition: { row: 2, column: 0 }, endPosition: { row: 2, column: 12 }, children }
}
function call(name: string, args: SyntaxNode[]): SyntaxNode { return node("function_call_expression", "", null, [node("name", name, "function"), node("arguments", "", "arguments", args)]) }
function entry(key: string, value: SyntaxNode): SyntaxNode { return node("array_element_initializer", "", null, [node("string", `'${key}'`), value]) }
function array(items: SyntaxNode[]): SyntaxNode { return node("array_creation_expression", "", null, items) }

describe("WooCommerce convention extraction", () => {
  it("uses the same file eligibility boundary as its required PHP provider", () => {
    expect(match("woocommerce/src/Checkout.php")).toBe(true)
    expect(match("wordpress/src/wp-includes/build/pages.php")).toBe(false)
    expect(match("woocommerce/vendor/example.php")).toBe(false)
  })
  it("models Store API, checkout, scheduled actions, cart, and order lifecycle facts", () => {
    const tree = node("program", "", null, [
      call("woocommerce_register_additional_checkout_field", [array([entry("id", node("string", "'demo/gift'")), entry("sanitize_callback", node("string", "'sanitize_gift'"))])]),
      call("woocommerce_store_api_register_endpoint_data", [array([entry("endpoint", node("string", "'cart'")), entry("namespace", node("string", "'demo'")), entry("data_callback", node("string", "'cart_data'"))])]),
      call("as_schedule_recurring_action", [node("integer", "100"), node("integer", "3600"), node("string", "'woocommerce_demo_refresh'")]),
      node("member_call_expression", "", null, [node("variable_name", "$cart", "object"), node("name", "add_to_cart", "name"), node("arguments", "", "arguments", [])]),
      node("member_call_expression", "", null, [node("variable_name", "$order", "object"), node("name", "payment_complete", "name"), node("arguments", "", "arguments", [])]),
    ])
    const semantics = extract("plugins/commerce.php", "", tree).evidence?.semantics ?? []
    expect(semantics.map((item) => item.entity_kind)).toEqual(expect.arrayContaining([
      "woocommerce.checkout_field", "woocommerce.store_api_extension", "wordpress.hook", "woocommerce.cart_operation", "woocommerce.order_operation",
    ]))
    expect(semantics.find((item) => item.kind === "woocommerce.scheduled_action")?.relationships).toEqual(expect.arrayContaining([expect.objectContaining({ relation: "schedules" })]))
    expect(semantics.find((item) => item.entity_key === "payment_complete")?.properties).toMatchObject({ lifecycle_stage: "order.payment_complete" })
  })

  it("specializes WooCommerce hooks and preserves callback resolution outcomes", () => {
    const tree = node("program", "", null, [call("add_action", [node("string", "'woocommerce_checkout_process'"), node("string", "'validate_checkout'")])])
    const result = extract("plugins/commerce.php", "", tree, undefined, {
      nodes: [{ id: "callback", type: "symbol", label: "validate_checkout", canonicalID: "commerce.php:global:function:validate_checkout", sourceClass: "structural", properties: {} }], edges: [],
    })
    expect(result.evidence?.semantics?.[0]).toMatchObject({ kind: "woocommerce.hook_registration", entity_key: "woocommerce_checkout_process" })
    expect(result.evidence?.semantics?.[0].relationships).toEqual(expect.arrayContaining([expect.objectContaining({ relation: "subscribes_with", status: "resolved" })]))
  })
})
