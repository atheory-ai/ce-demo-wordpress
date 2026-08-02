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
      call("register_rest_route", [node("string", "'store/v1'"), node("string", "'/products'"), array([entry("methods", node("string", "'GET'"))])]),
      call("register_block_type", [node("string", "'demo/catalog'")]),
    ])
    const evidence = extract("plugins/catalog.php", "", tree).evidence
    expect(evidence?.semantics?.map((item) => item.entity_kind)).toEqual(expect.arrayContaining(["wordpress.hook", "http.route", "gutenberg.block"]))
    expect(evidence?.semantics?.find((item) => item.entity_kind === "wordpress.hook")?.properties).toMatchObject({ family: "woocommerce", direction: "registration" })
  })

  it("emits no competing file anchor without a parsed tree", () => {
    const result = extract("plugins/catalog.php", "add_action('x', 'y')", null)
    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
    expect(result.evidence?.semantic_coverage?.every((coverage) => coverage.status === "unavailable")).toBe(true)
  })

  it("leaves source anchoring to CE semantic projection", () => {
    const tree = node("program", "", null, [call("do_action", [node("string", "'demo_ready'")])])
    const result = extract("plugins/catalog.php", "", tree, { type: "file", canonicalID: "canonical/catalog.php" })
    expect(result.edges).toHaveLength(0)
    expect(result.evidence?.semantics?.[0]).toMatchObject({ entity_kind: "wordpress.hook", entity_key: "demo_ready" })
  })

  it("uses PHP's named call children when grammar field names are unavailable", () => {
    const tree = node("program", "", null, [
      node("function_call_expression", "", null, [
        node("name", "do_action"),
        node("arguments", "", null, [node("string", "'demo_ready'")]),
      ]),
    ])
    expect(extract("plugins/catalog.php", "", tree).evidence?.semantics?.filter((item) => item.entity_kind === "wordpress.hook")).toHaveLength(1)
  })

  it("unwraps the pinned PHP grammar's argument nodes", () => {
    const tree = node("program", "", null, [
      call("apply_filters", [node("argument", "", null, [node("string", "'demo_value'")])]),
    ])
    expect(extract("plugins/catalog.php", "", tree).evidence?.semantics?.find((item) => item.entity_kind === "wordpress.hook")?.label).toBe("demo_value")
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

    const route = extract("plugins/catalog.php", "", tree, undefined, {
      nodes: [{ id: "handler", type: "symbol", label: "get_catalog", canonicalID: "Demo:global:function:get_catalog", sourceClass: "structural", properties: {} }],
      edges: [],
    }).evidence?.semantics?.find((item) => item.entity_kind === "http.route")
    expect(route?.properties).toMatchObject({
      namespace: "demo/v1",
      route: "/catalog",
      methods: "WP_REST_Server::READABLE",
      callback: "'get_catalog'",
      permission_callback: "__return_true",
      permission_callback_presence: "observed",
      args_declaration: "$args",
    })
    expect(route?.entity_key).toBe("GET demo/v1/catalog")
    expect(route?.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({ relation: "handles", status: "resolved", target: expect.objectContaining({ canonical_id: "Demo:global:function:get_catalog" }) }),
      expect.objectContaining({ relation: "authorizes_with", status: "unresolved" }),
    ]))
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

    const route = extract("plugins/catalog.php", "", tree).evidence?.semantics?.find((item) => item.entity_kind === "http.route")
    expect(route?.properties).toMatchObject({
      methods: "WP_REST_Server::READABLE",
      permission_callback: "__return_true",
    })
  })

  it("models server-rendered block boundaries as observed configuration", () => {
    const tree = node("program", "", null, [
      call("register_block_type", [
        node("string", "'demo/catalog'"),
        array([
          entry("render_callback", node("string", "'render_catalog'")),
          entry("editor_script", node("string", "'demo-catalog-editor'")),
        ]),
      ]),
    ])

    const result = extract("plugins/catalog.php", "", tree)
    expect(result.evidence?.semantics?.find((item) => item.entity_kind === "gutenberg.block")?.properties).toMatchObject({
      render_callback: "'render_catalog'",
      editor_script: "'demo-catalog-editor'",
    })
  })

  it("retains computed framework identities as dynamic evidence instead of canonical facts", () => {
    const tree = node("program", "", null, [
      call("do_action", [node("binary_expression", "'prefix_' . $suffix", null, [node("string", "'prefix_'"), node("variable_name", "$suffix")])]),
      call("register_rest_route", [node("variable_name", "$namespace"), node("variable_name", "$route"), array([entry("methods", node("variable_name", "$methods"))])]),
      call("register_rest_route", [node("variable_name", "$namespace"), node("string", "'/items'"), array([entry("methods", node("string", "'GET'"))])]),
      call("register_block_type", [node("variable_name", "$block_json_file")]),
    ])

    const semantics = extract("plugins/dynamic.php", "", tree).evidence?.semantics ?? []
    expect(semantics).toHaveLength(4)
    for (const occurrence of semantics) {
      expect(occurrence.entity_kind).toBeUndefined()
      expect(occurrence.entity_key).toBeUndefined()
      expect(["dynamic", "unresolved"]).toContain(occurrence.status)
    }
    expect(semantics.find((item) => item.kind === "wordpress.hook_call")).toMatchObject({
      label: "'prefix_' . $suffix",
      status: "dynamic",
    })
    expect(semantics.find((item) => item.kind === "gutenberg.block_registration")).toMatchObject({
      label: "$block_json_file",
      status: "dynamic",
    })
  })

  it("records security APIs as observed boundaries, not correctness verdicts", () => {
    const tree = node("program", "", null, [
      call("current_user_can", [node("string", "'manage_woocommerce'")]),
      call("sanitize_text_field", [node("name", "$request_value")]),
    ])

    const result = extract("plugins/catalog.php", "", tree)
    expect(result.evidence?.semantics?.filter((item) => item.entity_kind === "wordpress.security_api").map((item) => item.properties?.category)).toEqual(expect.arrayContaining(["capability_check", "sanitize"]))
  })

  it("records hook lifecycle, removal, inspection, shortcode, and cron semantics", () => {
    const tree = node("program", "", null, [
      call("add_action", [node("string", "'init'"), node("string", "'boot'"), node("integer", "20")]),
      call("remove_filter", [node("string", "'the_content'"), node("string", "'decorate'")]),
      call("did_action", [node("string", "'init'")]),
      call("add_shortcode", [node("string", "'catalog'"), node("string", "'render_catalog'")]),
      call("wp_schedule_event", [node("integer", "100"), node("string", "'hourly'"), node("string", "'catalog_refresh'")]),
    ])
    const semantics = extract("plugins/runtime.php", "", tree).evidence?.semantics ?? []
    expect(semantics.find((item) => item.properties?.api === "add_action")?.properties).toMatchObject({ lifecycle_stage: "request.init", priority: "20", accepted_args: "1" })
    expect(semantics.find((item) => item.properties?.api === "remove_filter")?.relationships).toEqual(expect.arrayContaining([expect.objectContaining({ relation: "unsubscribes_with" })]))
    expect(semantics.find((item) => item.properties?.api === "did_action")?.relationships).toEqual(expect.arrayContaining([expect.objectContaining({ relation: "inspects" })]))
    expect(semantics.map((item) => item.entity_kind)).toEqual(expect.arrayContaining(["wordpress.shortcode", "wordpress.hook"]))
  })

  it("retains the CST-proven enclosing callable offset without copied PHP nodes", () => {
    const dispatch = call("do_action", [node("string", "'demo_ready'")])
    dispatch.startByte = 30
    dispatch.endByte = 50
    const callable = node("function_definition", "", null, [node("name", "dispatch_demo", "name"), dispatch])
    callable.startByte = 10
    callable.endByte = 70
    const tree = node("program", "", null, [callable])
    tree.startByte = 0
    tree.endByte = 80
    expect(extract("plugins/runtime.php", "", tree).evidence?.semantics?.[0].enclosing_start_byte).toBe(10)
  })
})
