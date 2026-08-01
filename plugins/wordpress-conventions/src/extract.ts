import { childByField, firstDescendantByType, semanticCoverage, semanticOccurrence, semanticRelationship, structuralEntity, unresolvedSemanticRelationship, walk } from "@atheory-ai/ce-plugin-sdk"
import type { ExtractionResult, Node, RawEvidence, RawSemanticRelationshipEvidence, SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

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
export const extract = (
  filePath: string,
  _content: string,
  tree: SyntaxNode | null,
  _sourceAnchor?: { type: "file"; canonicalID: string },
  contribution?: ExtractionResult,
): ExtractionResult => {
  const evidence: RawEvidence = {}
  const capabilities = new Map<string, { observed: number; unresolved: number }>()
  const declaredCapabilities = ["wordpress.hooks", "wordpress.rest_routes", "gutenberg.blocks", "wordpress.security_boundaries", "woocommerce.checkout_fields", "woocommerce.store_api_extensions", "woocommerce.cart_effects"]
  if (!tree) {
    evidence.semantic_coverage = declaredCapabilities.map((capability) => semanticCoverage("com.atheory-ai.wordpress-demo.conventions", capability, "unavailable", { reason: "No PHP CST was available." }))
    return { nodes: [], edges: [], evidence }
  }

  const addFact = (type: string, label: string, call: SyntaxNode, properties: Record<string, unknown>): string => {
    const definition = semanticDefinition(type, label, properties)
    const relationships = semanticRelationships(type, properties, contribution?.nodes ?? [])
    const unresolved = relationships.filter((relationship) => relationship.status !== "resolved").length
    const counts = capabilities.get(definition.capability) ?? { observed: 0, unresolved: 0 }
    counts.observed++
    counts.unresolved += unresolved
    capabilities.set(definition.capability, counts)
    ;(evidence.semantics ??= []).push(semanticOccurrence({
      producer: "com.atheory-ai.wordpress-demo.conventions",
      kind: definition.occurrenceKind,
      entityKind: definition.entityKind,
      entityKey: definition.entityKey,
      label,
      startByte: call.startByte,
      endByte: call.endByte,
      properties: scalarProperties(properties),
      relationships,
    }))
    return definition.entityKey
  }

  walk(tree, (call) => {
    if (call.type === "function_call_expression") {
      extractFunctionCall(call, filePath, addFact)
      return
    }
    if (call.type === "member_call_expression") extractCartEffect(call, addFact)
  })

  evidence.semantic_coverage = declaredCapabilities.map((capability) => {
    const counts = capabilities.get(capability) ?? { observed: 0, unresolved: 0 }
    return semanticCoverage(
      "com.atheory-ai.wordpress-demo.conventions",
      capability,
      counts.observed === 0 ? "not_applicable" : counts.unresolved === 0 ? "complete" : "partial",
      { observed: counts.observed, emitted: counts.observed, unresolved: counts.unresolved },
    )
  })
  return { nodes: [], edges: [], evidence }
}

type AddFact = (type: string, label: string, call: SyntaxNode, properties: Record<string, unknown>) => string

function semanticDefinition(type: string, label: string, properties: Record<string, unknown>): { capability: string; occurrenceKind: string; entityKind: string; entityKey: string } {
  switch (type) {
    case "wordpress_hook": return { capability: "wordpress.hooks", occurrenceKind: "wordpress.hook_call", entityKind: "wordpress.hook", entityKey: label }
    case "wordpress_route": return { capability: "wordpress.rest_routes", occurrenceKind: "wordpress.route_registration", entityKind: "http.route", entityKey: `${String(properties.methods ?? "ANY")} ${label}` }
    case "wordpress_block": return { capability: "gutenberg.blocks", occurrenceKind: "gutenberg.block_registration", entityKind: "gutenberg.block", entityKey: label }
    case "wordpress_security_boundary": return { capability: "wordpress.security_boundaries", occurrenceKind: "wordpress.security_boundary", entityKind: "wordpress.security_api", entityKey: `${String(properties.category ?? "boundary")}:${label}` }
    case "woocommerce_checkout_field": return { capability: "woocommerce.checkout_fields", occurrenceKind: "woocommerce.checkout_field_registration", entityKind: "woocommerce.checkout_field", entityKey: label }
    case "woocommerce_store_api_extension": return { capability: "woocommerce.store_api_extensions", occurrenceKind: "woocommerce.store_api_extension_registration", entityKind: "woocommerce.store_api_extension", entityKey: `${label}:${String(properties.endpoint ?? properties.namespace ?? "")}` }
    case "woocommerce_cart_effect": return { capability: "woocommerce.cart_effects", occurrenceKind: "woocommerce.cart_effect", entityKind: "woocommerce.cart_operation", entityKey: label }
    default: return { capability: "wordpress.unknown", occurrenceKind: type, entityKind: type, entityKey: label }
  }
}

function semanticRelationships(type: string, properties: Record<string, unknown>, nodes: Node[]): RawSemanticRelationshipEvidence[] {
  const relationships: RawSemanticRelationshipEvidence[] = []
  const addCallable = (relation: string, expression: unknown): void => {
    const value = typeof expression === "string" ? expression : ""
    if (!value) return
    const normalized = value.replace(/^(?:'|")|(?:'|")$/g, "")
    const candidates = nodes.filter((node) => node.type === "symbol" && (node.label === normalized || node.label.endsWith(`.${normalized}`)))
    if (candidates.length === 1) {
      relationships.push(semanticRelationship(relation, structuralEntity("symbol", candidates[0].canonicalID), { method: "same-file-symbol", confidence: "high" }))
    } else {
      relationships.push(unresolvedSemanticRelationship(relation, value, candidates.length > 1 ? "ambiguous" : callableKindFromText(value) === "closure" ? "dynamic" : "unresolved", candidates.map((candidate) => candidate.canonicalID)))
    }
  }
  if (type === "wordpress_hook" && properties.phase === "registration") addCallable("subscribes_with", properties.callback)
  if (type === "wordpress_hook" && properties.phase === "dispatch") relationships.push(semanticRelationship("dispatches", { entity_kind: "wordpress.hook", entity_key: String(properties.hook ?? "") }, { method: "literal-hook-name", confidence: "high" }))
  if (type === "wordpress_route") {
    addCallable("handles", properties.callback)
    addCallable("authorizes_with", properties.permission_callback)
  }
  if (type === "wordpress_block") addCallable("renders_with", properties.render_callback)
  if (type === "woocommerce_checkout_field") {
    addCallable("sanitizes_with", properties.sanitize_callback)
    addCallable("validates_with", properties.validate_callback)
  }
  if (type === "woocommerce_store_api_extension") {
    addCallable("provides_data_with", properties.data_callback)
    addCallable("provides_schema_with", properties.schema_callback)
    addCallable("updates_with", properties.update_callback)
  }
  return relationships
}

function scalarProperties(properties: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null && ["string", "number", "boolean"].includes(typeof value)) result[key] = String(value)
  }
  return result
}

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
