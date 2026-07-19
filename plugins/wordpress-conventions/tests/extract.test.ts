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

function entry(key: string, value: SyntaxNode, useFields = false): SyntaxNode {
  return node("array_element_initializer", "", null, [
    node("string", `'${key}'`, useFields ? "key" : null),
    { ...value, fieldName: useFields ? "value" : value.fieldName },
  ])
}

function array(entries: SyntaxNode[]): SyntaxNode {
  return node("array_creation_expression", "", null, entries)
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

  it("emits no competing file anchor without a parsed tree", () => {
    const result = extract("plugins/catalog.php", "add_action('x', 'y')", null)
    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })

  it("uses the host-provided canonical source anchor for convention edges", () => {
    const tree = node("program", "", null, [call("do_action", [node("string", "'demo_ready'")])])
    const result = extract("plugins/catalog.php", "", tree, { type: "file", canonicalID: "canonical/catalog.php" })
    expect(result.edges[0]?.sourceID).toBe("file:canonical/catalog.php")
  })

  it("uses PHP's named call children when grammar field names are unavailable", () => {
    const tree = node("program", "", null, [
      node("function_call_expression", "", null, [
        node("name", "do_action"),
        node("arguments", "", null, [node("string", "'demo_ready'")]),
      ]),
    ])
    expect(extract("plugins/catalog.php", "", tree).nodes.filter((item) => item.type === "wordpress_hook")).toHaveLength(1)
  })

  it("unwraps the pinned PHP grammar's argument nodes", () => {
    const tree = node("program", "", null, [
      call("apply_filters", [node("argument", "", null, [node("string", "'demo_value'")])]),
    ])
    expect(extract("plugins/catalog.php", "", tree).nodes.find((item) => item.type === "wordpress_hook")?.label).toBe("demo_value")
  })

  it("preserves REST callback and permission configuration without resolving dynamic callables", () => {
    const tree = node("program", "", null, [
      call("register_rest_route", [
        node("string", "'demo/v1'"),
        node("string", "'/catalog'"),
        array([
          entry("methods", node("name", "WP_REST_Server::READABLE")),
          entry("callback", node("string", "'get_catalog'")),
          entry("permission_callback", node("name", "__return_true")),
          entry("args", node("name", "$args")),
        ]),
      ]),
    ])

    const route = extract("plugins/catalog.php", "", tree).nodes.find((item) => item.type === "wordpress_route")
    expect(route?.properties).toMatchObject({
      namespace: "demo/v1",
      route: "/catalog",
      methods: "WP_REST_Server::READABLE",
      callback: "'get_catalog'",
      permission_callback: "__return_true",
      permission_callback_presence: "observed",
      args_declaration: "$args",
    })
  })

  it("uses the PHP grammar's named array key and value fields when available", () => {
    const tree = node("program", "", null, [
      call("register_rest_route", [
        node("string", "'demo/v1'"),
        node("string", "'/catalog'"),
        array([
          entry("methods", node("name", "WP_REST_Server::READABLE"), true),
          entry("permission_callback", node("name", "__return_true"), true),
        ]),
      ]),
    ])

    const route = extract("plugins/catalog.php", "", tree).nodes.find((item) => item.type === "wordpress_route")
    expect(route?.properties).toMatchObject({
      methods: "WP_REST_Server::READABLE",
      permission_callback: "__return_true",
    })
  })

  it("models block and Store API extension boundaries as observed configuration", () => {
    const tree = node("program", "", null, [
      call("woocommerce_register_additional_checkout_field", [
        array([
          entry("id", node("string", "'demo/gift-message'")),
          entry("location", node("string", "'order'")),
          entry("type", node("string", "'text'")),
          entry("required", node("name", "true")),
          entry("sanitize_callback", node("name", "sanitize_text_field")),
        ]),
      ]),
      call("register_block_type", [
        node("string", "'demo/catalog'"),
        array([
          entry("render_callback", node("string", "'render_catalog'")),
          entry("editor_script", node("string", "'demo-catalog-editor'")),
        ]),
      ]),
      call("woocommerce_store_api_register_endpoint_data", [
        array([
          entry("endpoint", node("name", "CartSchema::IDENTIFIER")),
          entry("namespace", node("string", "'demo'")),
          entry("data_callback", node("name", "get_cart_data")),
          entry("schema_callback", node("name", "get_cart_schema")),
        ]),
      ]),
    ])

    const result = extract("plugins/catalog.php", "", tree)
    expect(result.nodes.find((item) => item.type === "woocommerce_checkout_field")?.properties).toMatchObject({
      id: "'demo/gift-message'",
      location: "'order'",
      field_type: "'text'",
      required: "true",
      sanitize_callback: "sanitize_text_field",
      observed_only: true,
    })
    expect(result.nodes.find((item) => item.type === "wordpress_block")?.properties).toMatchObject({
      render_callback: "'render_catalog'",
      editor_script: "'demo-catalog-editor'",
    })
    expect(result.nodes.find((item) => item.type === "woocommerce_store_api_extension")?.properties).toMatchObject({
      operation: "register_endpoint_data",
      endpoint: "CartSchema::IDENTIFIER",
      namespace: "'demo'",
      data_callback: "get_cart_data",
      schema_callback: "get_cart_schema",
    })
  })

  it("records security and cart APIs as observed boundaries, not correctness verdicts", () => {
    const tree = node("program", "", null, [
      call("current_user_can", [node("string", "'manage_woocommerce'")]),
      call("sanitize_text_field", [node("name", "$request_value")]),
      node("member_call_expression", "", null, [
        node("variable_name", "$cart", "object"),
        node("name", "add_to_cart", "name"),
        node("arguments", "", "arguments", [node("integer", "123")]),
      ]),
    ])

    const result = extract("plugins/catalog.php", "", tree)
    expect(result.nodes.filter((item) => item.type === "wordpress_security_boundary").map((item) => item.properties.category)).toEqual(expect.arrayContaining(["capability_check", "sanitize"]))
    expect(result.nodes.find((item) => item.type === "woocommerce_cart_effect")?.properties).toMatchObject({
      operation: "add_item",
      receiver: "$cart",
      observed_only: true,
    })
  })
})
