import { childByField, firstDescendantByType, semanticCoverage, semanticOccurrence, semanticRelationship, structuralEntity, unresolvedSemanticRelationship, walk } from "@atheory-ai/ce-plugin-sdk"
import type { ExtractionResult, Node, RawEvidence, RawSemanticRelationshipEvidence, SemanticResolutionStatus, SyntaxNode } from "@atheory-ai/ce-plugin-sdk"
import { extractWordPressStateEffects, WORDPRESS_STATE_CAPABILITIES } from "./state-effects.js"

const PRODUCER = "com.atheory-ai.wordpress-demo.conventions"
const PRODUCER_VERSION = "0.6.0"

const profiledCoverage = (capability: string, profile: string, observed: number, unresolved: number) =>
  semanticCoverage(PRODUCER, capability, observed === 0 ? "not_applicable" : unresolved === 0 ? "complete" : "partial", {
    producerVersion: PRODUCER_VERSION,
    evidenceSchema: "semantic-occurrences/v1",
    coverageProfile: profile,
    inspected: true,
    observed,
    emitted: observed,
    unresolved,
    reasonCode: observed === 0 ? "no_profiled_construct" : unresolved > 0 ? "partial_resolution" : undefined,
  })

const unavailableProfiledCoverage = (capability: string, profile: string) =>
  semanticCoverage(PRODUCER, capability, "unavailable", {
    producerVersion: PRODUCER_VERSION,
    evidenceSchema: "semantic-occurrences/v1",
    coverageProfile: profile,
    inspected: false,
    reasonCode: "missing_input",
    reason: "No PHP CST was available.",
  })

const HOOK_APIS = new Set([
  "add_action", "add_filter", "remove_action", "remove_filter",
  "do_action", "do_action_ref_array", "apply_filters", "apply_filters_ref_array",
  "has_action", "has_filter", "did_action", "doing_action", "doing_filter",
])
const SHORTCODE_APIS = new Set(["add_shortcode", "remove_shortcode", "shortcode_exists"])
const CRON_APIS = new Set(["wp_schedule_event", "wp_schedule_single_event", "wp_schedule_single_action", "wp_unschedule_event", "wp_clear_scheduled_hook", "wp_next_scheduled"])
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

/**
 * Extracts source-evidenced WordPress facts. The facts intentionally
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
  const declaredCapabilities = ["wordpress.hooks", "wordpress.rest_routes", "wordpress.shortcodes", "wordpress.cron", "gutenberg.blocks", "wordpress.security_boundaries"]
  if (!tree) {
    evidence.semantic_coverage = [
      ...[...declaredCapabilities, ...WORDPRESS_STATE_CAPABILITIES].map((capability) => semanticCoverage(PRODUCER, capability, "unavailable", { reason: "No PHP CST was available." })),
      unavailableProfiledCoverage("ce.framework.lifecycle.wordpress/1", "wordpress-lifecycle/v1"),
      unavailableProfiledCoverage("ce.framework.state.wordpress/1", "wordpress-state/v1"),
    ]
    return { nodes: [], edges: [], evidence }
  }

  const callableScopes = collectCallableScopes(tree, contribution?.nodes ?? [])
  const addFact: AddFact = (type, label, call, properties, identity) => {
    const definition = semanticDefinition(type, label, properties)
    const entityKey = identity && Object.hasOwn(identity, "entityKey") ? identity.entityKey : definition.entityKey
    const status = identity?.status ?? (entityKey ? "resolved" : "unresolved")
    const owner = enclosingCallable(call, callableScopes)
    const relationships = semanticRelationships(type, properties, contribution?.nodes ?? [], definition.entityKind, entityKey, owner?.canonicalID)
    const unresolved = relationships.filter((relationship) => relationship.status !== "resolved").length + (status === "resolved" ? 0 : 1)
    const counts = capabilities.get(definition.capability) ?? { observed: 0, unresolved: 0 }
    counts.observed++
    counts.unresolved += unresolved
    capabilities.set(definition.capability, counts)
    ;(evidence.semantics ??= []).push(semanticOccurrence({
      producer: PRODUCER,
      producerVersion: PRODUCER_VERSION,
      capability: "ce.framework.lifecycle.wordpress/1",
      evidenceSchema: "semantic-occurrences/v1",
      kind: definition.occurrenceKind,
      entityKind: entityKey ? definition.entityKind : undefined,
      entityKey,
      label,
      status,
      startByte: call.startByte,
      endByte: call.endByte,
      properties: scalarProperties({ ...properties, enclosing_callable: owner?.canonicalID }),
      relationships,
      enclosingStartByte: owner?.startByte,
    }))
    return entityKey ?? ""
  }

  walk(tree, (call) => {
    if (call.type === "function_call_expression") {
      extractFunctionCall(call, filePath, addFact)
      return
    }
  })

  const stateEffects = extractWordPressStateEffects(contribution)
  ;(evidence.semantics ??= []).push(...stateEffects.semantics)

  const legacyLifecycleCoverage = declaredCapabilities.map((capability) => {
    const counts = capabilities.get(capability) ?? { observed: 0, unresolved: 0 }
    return semanticCoverage(
      PRODUCER,
      capability,
      counts.observed === 0 ? "not_applicable" : counts.unresolved === 0 ? "complete" : "partial",
      { observed: counts.observed, emitted: counts.observed, unresolved: counts.unresolved },
    )
  })
  const lifecycleCounts = [...capabilities.values()].reduce((total, counts) => ({
    observed: total.observed + counts.observed,
    unresolved: total.unresolved + counts.unresolved,
  }), { observed: 0, unresolved: 0 })
  const stateCounts = stateEffects.coverage.reduce((total, coverage) => ({
    observed: total.observed + (coverage.observed ?? 0),
    unresolved: total.unresolved + (coverage.unresolved ?? 0),
  }), { observed: 0, unresolved: 0 })
  evidence.semantic_coverage = legacyLifecycleCoverage.concat(stateEffects.coverage, [
    profiledCoverage("ce.framework.lifecycle.wordpress/1", "wordpress-lifecycle/v1", lifecycleCounts.observed, lifecycleCounts.unresolved),
    profiledCoverage("ce.framework.state.wordpress/1", "wordpress-state/v1", stateCounts.observed, stateCounts.unresolved),
  ])
  return { nodes: [], edges: [], evidence }
}

type FactIdentity = { entityKey?: string; status?: SemanticResolutionStatus }
type AddFact = (type: string, label: string, call: SyntaxNode, properties: Record<string, unknown>, identity?: FactIdentity) => string

function semanticDefinition(type: string, label: string, properties: Record<string, unknown>): { capability: string; occurrenceKind: string; entityKind: string; entityKey: string } {
  switch (type) {
    case "wordpress_hook": return { capability: "wordpress.hooks", occurrenceKind: "wordpress.hook_call", entityKind: "wordpress.hook", entityKey: label }
    case "wordpress_shortcode": return { capability: "wordpress.shortcodes", occurrenceKind: "wordpress.shortcode_registration", entityKind: "wordpress.shortcode", entityKey: label }
    case "wordpress_cron": return { capability: "wordpress.cron", occurrenceKind: "wordpress.cron_schedule", entityKind: "wordpress.hook", entityKey: label }
    case "wordpress_route": return { capability: "wordpress.rest_routes", occurrenceKind: "wordpress.route_registration", entityKind: "http.route", entityKey: `${String(properties.methods ?? "ANY")} ${label}` }
    case "wordpress_block": return { capability: "gutenberg.blocks", occurrenceKind: "gutenberg.block_registration", entityKind: "gutenberg.block", entityKey: label }
    case "wordpress_security_boundary": return { capability: "wordpress.security_boundaries", occurrenceKind: "wordpress.security_boundary", entityKind: "wordpress.security_api", entityKey: `${String(properties.category ?? "boundary")}:${label}` }
    default: return { capability: "wordpress.unknown", occurrenceKind: type, entityKind: type, entityKey: label }
  }
}

function semanticRelationships(type: string, properties: Record<string, unknown>, nodes: Node[], entityKind: string, entityKey: string | undefined, ownerCanonicalID?: string): RawSemanticRelationshipEvidence[] {
  const relationships: RawSemanticRelationshipEvidence[] = []
  const addCallable = (relation: string, expression: unknown): void => {
    const value = typeof expression === "string" ? expression : ""
    if (!value) return
    const callable = callableTarget(value, ownerCanonicalID)
    const candidates = nodes.filter((node) => node.type === "symbol" && callable.labels.some((label) => node.label === label || node.label.endsWith(`.${label}`)))
    if (candidates.length === 1) {
      relationships.push(semanticRelationship(relation, structuralEntity("symbol", candidates[0].canonicalID), { method: "same-file-symbol", confidence: "high" }))
    } else {
      relationships.push(unresolvedSemanticRelationship(relation, value, candidates.length > 1 ? "ambiguous" : callable.dynamic ? "dynamic" : "unresolved", candidates.map((candidate) => candidate.canonicalID)))
    }
  }
  if (type === "wordpress_hook" && properties.phase === "registration") addCallable("subscribes_with", properties.callback)
  if (type === "wordpress_hook" && properties.phase === "removal") addCallable("unsubscribes_with", properties.callback)
  if (type === "wordpress_hook" && properties.phase === "dispatch") {
    if (entityKey) relationships.push(semanticRelationship("dispatches", { entity_kind: entityKind, entity_key: entityKey }, { method: "literal-hook-name", confidence: "high" }))
    else relationships.push(unresolvedSemanticRelationship("dispatches", String(properties.hook_expression ?? properties.hook ?? ""), "dynamic"))
  }
  if (type === "wordpress_hook" && properties.phase === "inspection" && entityKey) relationships.push(semanticRelationship("inspects", { entity_kind: entityKind, entity_key: entityKey }, { method: "literal-hook-name", confidence: "high" }))
  if (type === "wordpress_shortcode" && properties.phase === "registration") addCallable("subscribes_with", properties.callback)
  if (type === "wordpress_shortcode" && properties.phase === "removal") addCallable("unsubscribes_with", properties.callback)
  if (type === "wordpress_cron" && entityKey) relationships.push(semanticRelationship(properties.phase === "schedule" ? "schedules" : "inspects", { entity_kind: entityKind, entity_key: entityKey }, { method: "literal-hook-name", confidence: "high" }))
  if (type === "wordpress_route") {
    addCallable("handles", properties.callback)
    addCallable("authorizes_with", properties.permission_callback)
  }
  if (type === "wordpress_block") addCallable("renders_with", properties.render_callback)
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
    const hookLiteral = literalStringValue(args[0])
    const hookExpression = expressionValue(args[0])
    if (!hookExpression) return
    const hook = hookLiteral ?? hookExpression
    const registration = functionName.startsWith("add_")
    const removal = functionName.startsWith("remove_")
    const dispatch = functionName.startsWith("do_") || functionName.startsWith("apply_")
    const phase = registration ? "registration" : removal ? "removal" : dispatch ? "dispatch" : "inspection"
    addFact("wordpress_hook", hook, call, {
      api: functionName,
      hook,
      hook_expression: hookExpression,
      hook_kind: functionName.endsWith("filter") ? "filter" : "action",
      phase,
      // Kept for backwards compatibility with the initial demo vocabulary.
      direction: phase,
      callback: registration || removal ? expressionValue(args[1]) : undefined,
      callback_kind: registration || removal ? callableKind(args[1]) : undefined,
      priority: registration || removal ? expressionValue(args[2]) ?? "10" : undefined,
      accepted_args: registration ? expressionValue(args[3]) ?? "1" : undefined,
      lifecycle_stage: hookLifecycle(hookLiteral),
      dynamic_pattern: hookLiteral ? undefined : hookPattern(hookExpression),
      family: hook.startsWith("woocommerce_") ? "woocommerce" : "wordpress",
    }, hookLiteral ? { entityKey: hookLiteral, status: "resolved" } : { entityKey: undefined, status: "dynamic" })
    return
  }

  if (SHORTCODE_APIS.has(functionName)) {
    const tagLiteral = literalStringValue(args[0])
    const tagExpression = expressionValue(args[0])
    if (!tagExpression) return
    const phase = functionName === "add_shortcode" ? "registration" : functionName === "remove_shortcode" ? "removal" : "inspection"
    addFact("wordpress_shortcode", tagLiteral ?? tagExpression, call, {
      api: functionName,
      phase,
      shortcode: tagExpression,
      callback: phase === "registration" || phase === "removal" ? expressionValue(args[1]) : undefined,
      callback_kind: phase === "registration" || phase === "removal" ? callableKind(args[1]) : undefined,
    }, tagLiteral ? { entityKey: tagLiteral, status: "resolved" } : { entityKey: undefined, status: "dynamic" })
    return
  }

  if (CRON_APIS.has(functionName)) {
    const hookIndex = functionName === "wp_schedule_event" ? 2 : functionName === "wp_schedule_single_event" || functionName === "wp_schedule_single_action" ? 1 : functionName === "wp_unschedule_event" ? 1 : 0
    const hookLiteral = literalStringValue(args[hookIndex])
    const hookExpression = expressionValue(args[hookIndex])
    if (!hookExpression) return
    const schedule = functionName.startsWith("wp_schedule")
    addFact("wordpress_cron", hookLiteral ?? hookExpression, call, {
      api: functionName,
      phase: schedule ? "schedule" : functionName === "wp_next_scheduled" ? "inspection" : "removal",
      hook: hookExpression,
      timestamp: schedule ? expressionValue(args[0]) : undefined,
      recurrence: functionName === "wp_schedule_event" ? expressionValue(args[1]) : undefined,
      arguments: expressionValue(args[hookIndex + 1]),
      dynamic_pattern: hookLiteral ? undefined : hookPattern(hookExpression),
    }, hookLiteral ? { entityKey: hookLiteral, status: "resolved" } : { entityKey: undefined, status: "dynamic" })
    return
  }

  if (functionName === "register_rest_route") {
    const namespaceLiteral = literalStringValue(args[0])
    const routeLiteral = literalStringValue(args[1])
    const namespaceExpression = expressionValue(args[0])
    const routeExpression = expressionValue(args[1])
    if (!namespaceExpression || !routeExpression) return
    const namespace = namespaceLiteral ?? namespaceExpression
    const route = routeLiteral ?? routeExpression
    const options = arrayEntries(args[2])
    const routePath = namespaceLiteral && routeLiteral ? normalizeRoutePath(namespaceLiteral, routeLiteral) : `${namespaceExpression} ${routeExpression}`
    const methods = normalizeRouteMethods(options.methods)
    const entityKey = namespaceLiteral && routeLiteral && methods ? `${methods} ${routePath}` : undefined
    addFact("wordpress_route", routePath, call, {
      api: functionName,
      namespace,
      route,
      route_family: namespace === "wc/store" || namespace.startsWith("wc/store/") ? "woocommerce_store_api" : "wordpress_rest",
      methods: options.methods,
      normalized_methods: methods,
      callback: options.callback,
      callback_kind: callableKindFromText(options.callback),
      permission_callback: options.permission_callback,
      permission_callback_presence: options.permission_callback ? "observed" : "not_observed",
      args_declaration: options.args,
      options: expressionValue(args[2]),
    }, entityKey ? { entityKey, status: "resolved" } : { entityKey: undefined, status: namespaceLiteral && routeLiteral ? "unresolved" : "dynamic" })
    return
  }

  if (functionName === "register_block_type") {
    const blockExpression = expressionValue(args[0])
    if (!blockExpression) return
    const blockLiteral = literalStringValue(args[0])
    const blockName = blockLiteral && isCanonicalBlockName(blockLiteral) ? blockLiteral : undefined
    const settings = arrayEntries(args[1])
    addFact("wordpress_block", blockName ?? blockExpression, call, {
      api: functionName,
      block: blockExpression,
      registration_mode: blockName ? "literal_block_name" : blockLiteral ? "literal_metadata_path" : "computed_expression",
      render_callback: settings.render_callback,
      render_callback_kind: callableKindFromText(settings.render_callback),
      editor_script: settings.editor_script,
      settings: expressionValue(args[1]),
    }, blockName ? { entityKey: blockName, status: "resolved" } : { entityKey: undefined, status: blockLiteral ? "unresolved" : "dynamic" })
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

function literalStringValue(node: SyntaxNode | undefined): string | undefined {
  if (!node) return undefined
  const child = node.type === "argument" ? namedChildren(node)[0] : node
  if (child?.type !== "string") return undefined
  return child.text.replace(/^(?:'|")|(?:'|")$/g, "")
}

function literalExpressionValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const match = /^(['"])([\s\S]*)\1$/.exec(value.trim())
  return match?.[2]
}

function normalizeRoutePath(namespace: string, route: string): string {
  const normalizedNamespace = namespace.replace(/^\/+|\/+$/g, "")
  const normalizedRoute = "/" + route.replace(/^\/+/, "")
  return normalizedNamespace + normalizedRoute
}

function normalizeRouteMethods(expression: string | undefined): string | undefined {
  if (!expression) return undefined
  const constants: Record<string, string> = {
    "WP_REST_Server::READABLE": "GET",
    "\\WP_REST_Server::READABLE": "GET",
    "WP_REST_Server::CREATABLE": "POST",
    "\\WP_REST_Server::CREATABLE": "POST",
    "WP_REST_Server::EDITABLE": "PATCH|POST|PUT",
    "\\WP_REST_Server::EDITABLE": "PATCH|POST|PUT",
    "WP_REST_Server::DELETABLE": "DELETE",
    "\\WP_REST_Server::DELETABLE": "DELETE",
    "WP_REST_Server::ALLMETHODS": "DELETE|GET|PATCH|POST|PUT",
    "\\WP_REST_Server::ALLMETHODS": "DELETE|GET|PATCH|POST|PUT",
  }
  const trimmed = expression.trim()
  if (constants[trimmed]) return constants[trimmed]
  const literal = literalExpressionValue(trimmed)
  if (literal && /^[A-Za-z]+$/.test(literal)) return literal.toUpperCase()
  const methods = [...trimmed.matchAll(/['"](GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)['"]/gi)].map((match) => match[1].toUpperCase())
  return methods.length > 0 ? [...new Set(methods)].sort().join("|") : undefined
}

function isCanonicalBlockName(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/.test(value)
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

type CallableScope = { startByte: number; endByte: number; canonicalID: string }

function collectCallableScopes(tree: SyntaxNode, nodes: Node[]): CallableScope[] {
  const scopes: CallableScope[] = []
  walk(tree, (candidate) => {
    if (candidate.type !== "function_definition" && candidate.type !== "method_declaration") return
    const structural = nodes.find((node) => node.type === "symbol" && Number(node.properties?.start_byte) === candidate.startByte)
    scopes.push({ startByte: candidate.startByte, endByte: candidate.endByte, canonicalID: structural?.canonicalID ?? "" })
  })
  return scopes.sort((left, right) => (left.endByte - left.startByte) - (right.endByte - right.startByte))
}

function enclosingCallable(node: SyntaxNode, scopes: CallableScope[]): CallableScope | undefined {
  return scopes.find((scope) => scope.startByte <= node.startByte && scope.endByte >= node.endByte)
}

function callableTarget(value: string, ownerCanonicalID?: string): { labels: string[]; dynamic: boolean } {
  const text = value.trim()
  if (callableKindFromText(text) === "closure") return { labels: [], dynamic: true }
  const plain = /^(?:['"])([A-Za-z_\\][A-Za-z0-9_\\]*(?:::[A-Za-z_][A-Za-z0-9_]*)?)(?:['"])$/.exec(text)?.[1]
  if (plain) return { labels: [plain.replace("::", "."), plain.split("\\").at(-1)!.replace("::", ".")], dynamic: false }
  const arrayMethod = /(?:\[|array\s*\()\s*([^,]+),\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/.exec(text)
  if (arrayMethod) {
    const receiver = arrayMethod[1].trim().replace(/::class$/i, "").replace(/^(?:['"]|\\)+|['"]$/g, "")
    const method = arrayMethod[2]
    if (receiver === "$this" && ownerCanonicalID) {
      const ownerLabel = ownerCanonicalID.split(":").at(-1)?.split(".")[0]
      return { labels: ownerLabel ? [`${ownerLabel}.${method}`] : [method], dynamic: false }
    }
    if (/^[A-Za-z_\\][A-Za-z0-9_\\]*$/.test(receiver)) return { labels: [`${receiver.split("\\").at(-1)}.${method}`], dynamic: false }
    return { labels: [method], dynamic: true }
  }
  return { labels: [], dynamic: text.startsWith("$") || text.includes("->") }
}

function hookPattern(expression: string): string {
  return expression.replace(/\$\{[^}]+\}|\{\$[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*/g, "{dynamic}")
}

function hookLifecycle(hook: string | undefined): string | undefined {
  if (!hook) return undefined
  const stages: Record<string, string> = {
    muplugins_loaded: "bootstrap.mu_plugins", plugins_loaded: "bootstrap.plugins", setup_theme: "bootstrap.theme_setup",
    after_setup_theme: "bootstrap.after_theme_setup", init: "request.init", wp_loaded: "request.loaded",
    parse_request: "request.parse", send_headers: "request.headers", parse_query: "query.parse",
    pre_get_posts: "query.prepare", wp: "request.resolve", template_redirect: "response.template_redirect",
    wp_head: "render.head", wp_footer: "render.footer", shutdown: "shutdown",
    admin_init: "admin.init", rest_api_init: "rest.init",
  }
  return stages[hook]
}

function securityCategoryFor(functionName: string): string | undefined {
  if (SECURITY_APIS[functionName]) return SECURITY_APIS[functionName]
  if (functionName.startsWith("sanitize_")) return "sanitize"
  if (functionName.startsWith("esc_") || functionName.startsWith("wp_kses")) return "escape"
  return undefined
}
