import { childByField, edgeID, firstDescendantByType, nodeID, walk } from "@atheory-ai/ce-plugin-sdk"
import type { Edge, ExtractionResult, LanguageDefinition, Node, SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

const HOOK_APIS = new Set(["add_action", "add_filter", "do_action", "apply_filters"])
const STORE_API_EXTENSION_APIS = new Set([
  "woocommerce_store_api_register_endpoint_data",
  "woocommerce_store_api_register_update_callback",
  "woocommerce_store_api_register_payment_requirements",
])
const SECURITY_APIS: Record<string, string> = {
  current_user_can: "capability_check",
  user_can: "capability_check",
  wp_verify_nonce: "nonce_verify",
  check_ajax_referer: "nonce_verify",
  check_admin_referer: "nonce_verify",
  rest_ensure_response: "rest_response",
  wp_send_json_error: "error_response",
  wp_send_json_success: "success_response",
  wp_die: "error_response",
}
const CART_MUTATIONS: Record<string, string> = {
  add_to_cart: "add_item",
  remove_cart_item: "remove_item",
  set_quantity: "set_quantity",
  empty_cart: "empty_cart",
  set_address: "set_address",
  set_customer: "set_customer",
  apply_coupon: "apply_coupon",
  remove_coupon: "remove_coupon",
  calculate_totals: "calculate_totals",
}

/**
 * Extracts source-evidenced WordPress/WooCommerce facts. The facts intentionally
 * preserve expressions that cannot be statically resolved; they are navigation
 * evidence, not a runtime or security verdict.
 */
export const extract: LanguageDefinition["extract"] = (filePath, _content, tree, sourceAnchor): ExtractionResult => {
	const nodes: Node[] = []
	const edges: Edge[] = []
	// CE owns this anchor. The empty-project ID is deliberately only a stable
	// reference token; CE remaps it to the host-created project:file:<path> node.
	const fileID = nodeID("", "file", sourceAnchor?.canonicalID ?? filePath)
  if (!tree) return { nodes, edges }

  const addFact = (type: string, label: string, call: SyntaxNode, properties: Record<string, unknown>): string => {
    const canonicalID = `wordpress:${type}:${label}:${filePath}:${call.startByte}`
    const id = nodeID("", type, canonicalID)
    nodes.push({
      id,
      type,
      label,
      canonicalID,
      sourceClass: "structural",
      properties: {
        file_path: filePath,
        start_byte: call.startByte,
        start_line: call.startPosition.row,
        ...properties,
      },
    })
    edges.push({
      id: edgeID(fileID, "contains", id),
      sourceID: fileID,
      targetID: id,
      type: "contains",
      sourceClass: "structural",
      properties: {},
    })
    return id
  }

  walk(tree, (call) => {
    if (call.type === "function_call_expression") {
      extractFunctionCall(call, filePath, addFact)
      return
    }
    if (call.type === "member_call_expression") extractCartEffect(call, addFact)
  })

  return deduplicate(nodes, edges)
}

type AddFact = (type: string, label: string, call: SyntaxNode, properties: Record<string, unknown>) => string

function extractFunctionCall(call: SyntaxNode, filePath: string, addFact: AddFact): void {
  const functionNode = childByField(call, "function") ?? namedChildren(call).find((child) =>
    child.type === "name" || child.type === "qualified_name",
  )
  const functionName = normalizeCallName(functionNode?.text ?? "")
  if (!functionName) return
  const argumentsNode = childByField(call, "arguments") ?? namedChildren(call).find((child) => child.type === "arguments")
  const args = namedChildren(argumentsNode)

  if (HOOK_APIS.has(functionName)) {
    const hook = stringValue(args[0])
    if (!hook) return
    const registration = functionName.startsWith("add_")
    addFact("wordpress_hook", hook, call, {
      api: functionName,
      hook,
      hook_kind: functionName.endsWith("filter") ? "filter" : "action",
      phase: registration ? "registration" : "dispatch",
      // Kept for backwards compatibility with the initial demo vocabulary.
      direction: registration ? "registration" : "dispatch",
      callback: registration ? expressionValue(args[1]) : undefined,
      callback_kind: registration ? callableKind(args[1]) : undefined,
      priority: registration ? expressionValue(args[2]) : undefined,
      accepted_args: registration ? expressionValue(args[3]) : undefined,
      family: hook.startsWith("woocommerce_") ? "woocommerce" : "wordpress",
    })
    return
  }

  if (functionName === "register_rest_route") {
    const namespace = stringValue(args[0])
    const route = stringValue(args[1])
    if (!namespace || !route) return
    const options = arrayEntries(args[2])
    addFact("wordpress_route", `${namespace}${route}`, call, {
      api: functionName,
      namespace,
      route,
      route_family: namespace === "wc/store" || namespace.startsWith("wc/store/") ? "woocommerce_store_api" : "wordpress_rest",
      methods: options.methods,
      callback: options.callback,
      callback_kind: callableKindFromText(options.callback),
      permission_callback: options.permission_callback,
      permission_callback_presence: options.permission_callback ? "observed" : "not_observed",
      args_declaration: options.args,
      options: expressionValue(args[2]),
    })
    return
  }

  if (functionName === "register_block_type") {
    const block = expressionValue(args[0])
    if (!block) return
    const settings = arrayEntries(args[1])
    addFact("wordpress_block", block, call, {
      api: functionName,
      block,
      registration_mode: block.includes("/") && !block.includes("block.json") ? "name_or_path_expression" : "metadata_or_path_expression",
      render_callback: settings.render_callback,
      render_callback_kind: callableKindFromText(settings.render_callback),
      editor_script: settings.editor_script,
      settings: expressionValue(args[1]),
    })
    return
  }

  if (functionName === "woocommerce_register_additional_checkout_field") {
    const field = arrayEntries(args[0])
    const id = field.id ?? expressionValue(args[0])
    if (!id) return
    addFact("woocommerce_checkout_field", id, call, {
      api: functionName,
      id,
      label: field.label,
      location: field.location,
      field_type: field.type ?? "text_default",
      required: field.required,
      sanitize_callback: field.sanitize_callback,
      validate_callback: field.validate_callback,
      attributes: field.attributes,
      configuration: expressionValue(args[0]),
      observed_only: true,
    })
    return
  }

  if (STORE_API_EXTENSION_APIS.has(functionName)) {
    const config = arrayEntries(args[0])
    addFact("woocommerce_store_api_extension", functionName, call, {
      api: functionName,
      operation: storeApiOperation(functionName),
      endpoint: config.endpoint,
      namespace: config.namespace,
      data_callback: config.data_callback,
      schema_callback: config.schema_callback,
      update_callback: config.callback ?? config.update_callback,
      payment_requirements: config.payment_requirements,
      configuration: expressionValue(args[0]),
    })
    return
  }

  const securityCategory = securityCategoryFor(functionName)
  if (securityCategory) {
    addFact("wordpress_security_boundary", functionName, call, {
      api: functionName,
      category: securityCategory,
      argument_0: expressionValue(args[0]),
      argument_1: expressionValue(args[1]),
      observed_only: true,
    })
  }
}

function extractCartEffect(call: SyntaxNode, addFact: AddFact): void {
  const name = childByField(call, "name") ?? namedChildren(call).find((child) => child.type === "name")
  const method = normalizeCallName(name?.text ?? "")
  const operation = CART_MUTATIONS[method]
  if (!operation) return
  const receiver = childByField(call, "object") ?? namedChildren(call)[0]
  const argumentsNode = childByField(call, "arguments") ?? namedChildren(call).find((child) => child.type === "arguments")
  addFact("woocommerce_cart_effect", operation, call, {
    api: method,
    operation,
    receiver: expressionValue(receiver),
    arguments: expressionValue(argumentsNode),
    observed_only: true,
  })
}

function normalizeCallName(name: string): string {
  return name.replace(/^\\+/, "").toLowerCase()
}

function namedChildren(node: SyntaxNode | undefined | null): SyntaxNode[] {
  return (node?.children ?? []).filter((child) => child.isNamed)
}

function expressionValue(node: SyntaxNode | undefined): string | undefined {
  if (!node) return undefined
  const child = node.type === "argument" ? namedChildren(node)[0] : node
  return child?.text || undefined
}

function stringValue(node: SyntaxNode | undefined): string {
  if (!node) return ""
  const string = node.type === "string" ? node : firstDescendantByType(node, "string")
  return string?.text.replace(/^(?:'|")|(?:'|")$/g, "") ?? ""
}

function arrayEntries(node: SyntaxNode | undefined): Record<string, string> {
  if (!node) return {}
  const array = node.type === "array_creation_expression" ? node : firstDescendantByType(node, "array_creation_expression")
  if (!array) return {}
  const entries: Record<string, string> = {}
  for (const entry of namedChildren(array).filter((child) => child.type === "array_element_initializer")) {
    const children = namedChildren(entry)
    // The pinned PHP grammar exposes these fields. Retain positional fallback
    // for older parser builds and the minimal synthetic CSTs used by callers.
    const key = childByField(entry, "key") ?? children[0]
    const value = childByField(entry, "value") ?? children[1]
    const name = stringValue(key)
    const expression = expressionValue(value)
    if (name && expression) entries[name] = expression
  }
  return entries
}

function callableKind(node: SyntaxNode | undefined): string | undefined {
  return callableKindFromText(expressionValue(node))
}

function callableKindFromText(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.includes("function") || value.includes("fn(")) return "closure"
  if (value.includes("[") || value.includes("array(")) return "callable_array"
  if (value.startsWith("$") || value.includes("::") || value.includes("->")) return "dynamic_or_method_callable"
  return "function_name_or_expression"
}

function securityCategoryFor(functionName: string): string | undefined {
  if (SECURITY_APIS[functionName]) return SECURITY_APIS[functionName]
  if (functionName.startsWith("sanitize_")) return "sanitize"
  if (functionName.startsWith("esc_") || functionName.startsWith("wp_kses")) return "escape"
  return undefined
}

function storeApiOperation(api: string): string {
  if (api.endsWith("register_endpoint_data")) return "register_endpoint_data"
  if (api.endsWith("register_update_callback")) return "register_update_callback"
  return "register_payment_requirements"
}

function deduplicate(nodes: Node[], edges: Edge[]): ExtractionResult {
  const nodeIDs = new Set<string>()
  const edgeIDs = new Set<string>()
  return {
    nodes: nodes.filter((node) => !nodeIDs.has(node.id) && (nodeIDs.add(node.id), true)),
    edges: edges.filter((edge) => !edgeIDs.has(edge.id) && (edgeIDs.add(edge.id), true)),
  }
}
