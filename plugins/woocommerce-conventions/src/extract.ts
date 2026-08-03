import { childByField, firstDescendantByType, semanticCoverage, semanticOccurrence, semanticRelationship, structuralEntity, unresolvedSemanticRelationship, walk } from "@atheory-ai/ce-plugin-sdk"
import type { ExtractionResult, Node, RawEvidence, RawSemanticRelationshipEvidence, SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

const PRODUCER = "com.atheory-ai.wordpress-demo.woocommerce-conventions"
const PRODUCER_VERSION = "0.6.0"
const STORE_API_APIS = new Set([
  "woocommerce_store_api_register_endpoint_data",
  "woocommerce_store_api_register_update_callback",
  "woocommerce_store_api_register_payment_requirements",
])
const ACTION_SCHEDULER_APIS = new Set(["as_schedule_single_action", "as_schedule_recurring_action", "as_schedule_cron_action", "as_enqueue_async_action"])
const CART_EFFECTS = new Set(["add_to_cart", "remove_cart_item", "set_quantity", "empty_cart", "apply_coupon", "remove_coupon", "calculate_totals"])
const ORDER_EFFECTS = new Set(["save", "delete", "update_status", "set_status", "payment_complete", "add_order_note", "refund"])
const CAPABILITIES = ["woocommerce.hooks", "woocommerce.checkout_fields", "woocommerce.store_api_extensions", "woocommerce.scheduled_actions", "woocommerce.cart_effects", "woocommerce.order_lifecycle", "woocommerce.persistence_boundaries"]
const STATE_CAPABILITIES = new Set(["woocommerce.cart_effects", "woocommerce.order_lifecycle", "woocommerce.persistence_boundaries"])

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

export const extract = (
  _filePath: string,
  _content: string,
  tree: SyntaxNode | null,
  _sourceAnchor?: { type: "file"; canonicalID: string },
  contribution?: ExtractionResult,
): ExtractionResult => {
  const evidence: RawEvidence = {}
  const counts = new Map<string, { observed: number; unresolved: number }>()
  if (!tree) {
    evidence.semantic_coverage = [
      ...CAPABILITIES.map((capability) => semanticCoverage(PRODUCER, capability, "unavailable", { reason: "No PHP CST was available." })),
      unavailableProfiledCoverage("ce.framework.lifecycle.woocommerce/1", "woocommerce-lifecycle/v1"),
      unavailableProfiledCoverage("ce.framework.state.woocommerce/1", "woocommerce-state/v1"),
    ]
    return { nodes: [], edges: [], evidence }
  }
  const nodes = contribution?.nodes ?? []
  const scopes = callableScopes(tree, nodes)
  const emit = (capability: string, kind: string, entityKind: string, entityKey: string | undefined, label: string, call: SyntaxNode, properties: Record<string, unknown>, relationships: RawSemanticRelationshipEvidence[] = []): void => {
    const owner = scopes.find((scope) => scope.startByte <= call.startByte && scope.endByte >= call.endByte)
    const unresolved = (entityKey ? 0 : 1) + relationships.filter((relationship) => relationship.status !== "resolved").length
    const current = counts.get(capability) ?? { observed: 0, unresolved: 0 }
    current.observed++
    current.unresolved += unresolved
    counts.set(capability, current)
    ;(evidence.semantics ??= []).push(semanticOccurrence({
      producer: PRODUCER,
      producerVersion: PRODUCER_VERSION,
      capability: STATE_CAPABILITIES.has(capability) ? "ce.framework.state.woocommerce/1" : "ce.framework.lifecycle.woocommerce/1",
      evidenceSchema: "semantic-occurrences/v1",
      kind,
      entityKind: entityKey ? entityKind : undefined,
      entityKey,
      label,
      status: entityKey ? "resolved" : "dynamic",
      startByte: call.startByte,
      endByte: call.endByte,
      properties: scalars({ ...properties, enclosing_callable: owner?.canonicalID }),
      relationships,
      enclosingStartByte: owner?.startByte,
    }))
  }

  walk(tree, (call) => {
    if (call.type === "function_call_expression") extractFunctionCall(call, nodes, emit)
    if (call.type === "member_call_expression") extractMemberCall(call, emit)
  })
  for (const occurrence of contribution?.evidence?.semantics ?? []) {
    if (!occurrence.kind.startsWith("wordpress.state_") || !occurrence.entity_kind || !occurrence.entity_key || !isWooCommerceStateKey(occurrence.entity_key)) continue
    const operation = occurrence.kind.slice("wordpress.state_".length)
    if (operation !== "read" && operation !== "write" && operation !== "delete") continue
    const current = counts.get("woocommerce.persistence_boundaries") ?? { observed: 0, unresolved: 0 }
    current.observed++
    counts.set("woocommerce.persistence_boundaries", current)
    ;(evidence.semantics ??= []).push(semanticOccurrence({
      producer: PRODUCER,
      producerVersion: PRODUCER_VERSION,
      capability: "ce.framework.state.woocommerce/1",
      evidenceSchema: "semantic-occurrences/v1",
      kind: `woocommerce.state_${operation}`,
      entityKind: occurrence.entity_kind,
      entityKey: occurrence.entity_key,
      label: `WooCommerce ${operation} ${occurrence.entity_key}`,
      status: "resolved",
      confidence: "high",
      evidenceSource: "wordpress-state-contract/v1",
      startByte: occurrence.start_byte,
      endByte: occurrence.end_byte,
      enclosingStartByte: occurrence.enclosing_start_byte,
      properties: { domain: "woocommerce", operation, upstream_kind: occurrence.kind, ...(occurrence.properties ?? {}) },
      // WordPress owns the mechanics-derived state effect. This occurrence is
      // a domain classification of that fact, not a second read/write/delete
      // effect, so CE does not double-count one physical call site.
      relationships: [semanticRelationship("classifies_state", { entity_kind: occurrence.entity_kind, entity_key: occurrence.entity_key }, { method: "woocommerce-owned-state-key", confidence: "high" })],
    }))
  }
  const legacyCoverage = CAPABILITIES.map((capability) => {
    const current = counts.get(capability) ?? { observed: 0, unresolved: 0 }
    return semanticCoverage(PRODUCER, capability, current.observed === 0 ? "not_applicable" : current.unresolved === 0 ? "complete" : "partial", {
      observed: current.observed, emitted: current.observed, unresolved: current.unresolved,
    })
  })
  const aggregate = (state: boolean) => [...counts.entries()]
    .filter(([capability]) => STATE_CAPABILITIES.has(capability) === state)
    .reduce((total, [, value]) => ({ observed: total.observed + value.observed, unresolved: total.unresolved + value.unresolved }), { observed: 0, unresolved: 0 })
  const lifecycleCounts = aggregate(false)
  const stateCounts = aggregate(true)
  evidence.semantic_coverage = legacyCoverage.concat([
    profiledCoverage("ce.framework.lifecycle.woocommerce/1", "woocommerce-lifecycle/v1", lifecycleCounts.observed, lifecycleCounts.unresolved),
    profiledCoverage("ce.framework.state.woocommerce/1", "woocommerce-state/v1", stateCounts.observed, stateCounts.unresolved),
  ])
  return { nodes: [], edges: [], evidence }
}

type Emit = (capability: string, kind: string, entityKind: string, entityKey: string | undefined, label: string, call: SyntaxNode, properties: Record<string, unknown>, relationships?: RawSemanticRelationshipEvidence[]) => void

function extractFunctionCall(call: SyntaxNode, nodes: Node[], emit: Emit): void {
  const fn = normalize(childByField(call, "function")?.text ?? named(call).find((child) => child.type === "name" || child.type === "qualified_name")?.text ?? "")
  if (!fn) return
  const args = named(childByField(call, "arguments") ?? named(call).find((child) => child.type === "arguments"))

  if ((fn === "add_action" || fn === "add_filter" || fn === "do_action" || fn === "apply_filters") && literal(args[0])?.startsWith("woocommerce_")) {
    const hook = literal(args[0])!
    const registration = fn.startsWith("add_")
    const relationships: RawSemanticRelationshipEvidence[] = []
    if (registration) addCallable(relationships, "subscribes_with", expression(args[1]), nodes)
    else relationships.push(semanticRelationship("dispatches", { entity_kind: "wordpress.hook", entity_key: hook }, { method: "literal-hook-name", confidence: "high" }))
    emit("woocommerce.hooks", registration ? "woocommerce.hook_registration" : "woocommerce.hook_dispatch", "wordpress.hook", hook, hook, call, {
      api: fn, phase: registration ? "registration" : "dispatch", priority: registration ? expression(args[2]) ?? "10" : undefined,
      accepted_args: registration ? expression(args[3]) ?? "1" : undefined, lifecycle_stage: wooLifecycle(hook),
    }, relationships)
    return
  }

  if (fn === "woocommerce_register_additional_checkout_field") {
    const config = entries(args[0])
    const id = literalText(config.id)
    const relationships: RawSemanticRelationshipEvidence[] = []
    addCallable(relationships, "sanitizes_with", config.sanitize_callback, nodes)
    addCallable(relationships, "validates_with", config.validate_callback, nodes)
    emit("woocommerce.checkout_fields", "woocommerce.checkout_field_registration", "woocommerce.checkout_field", id, id ?? config.id ?? "checkout field", call, config, relationships)
    return
  }

  if (STORE_API_APIS.has(fn)) {
    const config = entries(args[0])
    const endpoint = literalText(config.endpoint)
    const namespace = literalText(config.namespace)
    const key = endpoint && namespace ? `${fn}:${endpoint}:${namespace}` : undefined
    const relationships: RawSemanticRelationshipEvidence[] = []
    addCallable(relationships, "provides_data_with", config.data_callback, nodes)
    addCallable(relationships, "provides_schema_with", config.schema_callback, nodes)
    addCallable(relationships, "updates_with", config.callback ?? config.update_callback, nodes)
    emit("woocommerce.store_api_extensions", "woocommerce.store_api_extension_registration", "woocommerce.store_api_extension", key, key ?? fn, call, { api: fn, endpoint: config.endpoint, namespace: config.namespace }, relationships)
    return
  }

  if (ACTION_SCHEDULER_APIS.has(fn)) {
    const hookIndex = fn === "as_schedule_recurring_action" || fn === "as_schedule_cron_action" ? 2 : 1
    const hook = literal(args[hookIndex])
    const hookExpression = expression(args[hookIndex])
    if (!hookExpression) return
    const relationships = hook ? [semanticRelationship("schedules", { entity_kind: "wordpress.hook", entity_key: hook }, { method: "literal-hook-name", confidence: "high" })] : [unresolvedSemanticRelationship("schedules", hookExpression, "dynamic")]
    emit("woocommerce.scheduled_actions", "woocommerce.scheduled_action", "wordpress.hook", hook, hook ?? hookExpression, call, {
      api: fn, timestamp: expression(args[0]), recurrence: fn === "as_schedule_recurring_action" ? expression(args[1]) : undefined,
      cron: fn === "as_schedule_cron_action" ? expression(args[1]) : undefined, group: expression(args[hookIndex + 2]),
    }, relationships)
  }
}

function extractMemberCall(call: SyntaxNode, emit: Emit): void {
  const method = normalize(childByField(call, "name")?.text ?? named(call).find((child) => child.type === "name")?.text ?? "")
  if (!CART_EFFECTS.has(method) && !ORDER_EFFECTS.has(method)) return
  const receiver = expression(childByField(call, "object") ?? named(call)[0])
  const capability = CART_EFFECTS.has(method) ? "woocommerce.cart_effects" : "woocommerce.order_lifecycle"
  const kind = CART_EFFECTS.has(method) ? "woocommerce.cart_effect" : "woocommerce.order_effect"
  const entityKind = CART_EFFECTS.has(method) ? "woocommerce.cart_operation" : "woocommerce.order_operation"
  emit(capability, kind, entityKind, method, method, call, { api: method, receiver, arguments: expression(childByField(call, "arguments")), lifecycle_stage: orderLifecycle(method) })
}

function addCallable(result: RawSemanticRelationshipEvidence[], relation: string, value: string | undefined, nodes: Node[]): void {
  if (!value) return
  const labels = callableLabels(value)
  const candidates = nodes.filter((node) => node.type === "symbol" && labels.some((label) => node.label === label || node.label.endsWith(`.${label}`)))
  if (candidates.length === 1) result.push(semanticRelationship(relation, structuralEntity("symbol", candidates[0].canonicalID), { method: "same-file-symbol", confidence: "high" }))
  else result.push(unresolvedSemanticRelationship(relation, value, candidates.length > 1 ? "ambiguous" : value.includes("function") || value.includes("->") || value.startsWith("$") ? "dynamic" : "unresolved", candidates.map((candidate) => candidate.canonicalID)))
}

function callableLabels(value: string): string[] {
  const plain = /^['"]([^'"]+)['"]$/.exec(value.trim())?.[1]
  if (plain) return [plain.replace("::", "."), plain.split("\\").at(-1)!.replace("::", ".")]
  const pair = /(?:\[|array\s*\()\s*([^,]+),\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/.exec(value)
  if (!pair) return []
  const receiver = pair[1].replace(/::class|['"\\\s]/gi, "").split("\\").at(-1)
  return receiver && receiver !== "$this" ? [`${receiver}.${pair[2]}`] : [pair[2]]
}

function callableScopes(tree: SyntaxNode, nodes: Node[]): Array<{ startByte: number; endByte: number; canonicalID: string }> {
  const result: Array<{ startByte: number; endByte: number; canonicalID: string }> = []
  walk(tree, (candidate) => {
    if (candidate.type !== "function_definition" && candidate.type !== "method_declaration") return
    const node = nodes.find((item) => item.type === "symbol" && Number(item.properties?.start_byte) === candidate.startByte)
    result.push({ startByte: candidate.startByte, endByte: candidate.endByte, canonicalID: node?.canonicalID ?? "" })
  })
  return result.sort((a, b) => (a.endByte - a.startByte) - (b.endByte - b.startByte))
}

function named(node: SyntaxNode | undefined | null): SyntaxNode[] { return (node?.children ?? []).filter((child) => child.isNamed) }
function expression(node: SyntaxNode | undefined): string | undefined { const value = node?.type === "argument" ? named(node)[0] : node; return value?.text || undefined }
function literal(node: SyntaxNode | undefined): string | undefined { const value = node?.type === "argument" ? named(node)[0] : node; return value?.type === "string" ? value.text.replace(/^(?:'|")|(?:'|")$/g, "") : undefined }
function literalText(value: string | undefined): string | undefined { return value ? /^(['"])([\s\S]*)\1$/.exec(value.trim())?.[2] : undefined }
function normalize(value: string): string { return value.replace(/^\\+/, "").toLowerCase() }
function scalars(values: Record<string, unknown>): Record<string, string> { return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => [key, String(value)])) }
function entries(node: SyntaxNode | undefined): Record<string, string> {
  const array = node?.type === "array_creation_expression" ? node : firstDescendantByType(node, "array_creation_expression")
  const result: Record<string, string> = {}
  for (const entry of named(array).filter((child) => child.type === "array_element_initializer")) {
    const children = named(entry); const key = childByField(entry, "key") ?? children[0]; const value = childByField(entry, "value") ?? children[1]
    const name = literal(key) ?? firstDescendantByType(key, "string")?.text.replace(/^(?:'|")|(?:'|")$/g, "")
    const text = expression(value); if (name && text) result[name] = text
  }
  return result
}
function wooLifecycle(hook: string): string { if (hook.includes("checkout")) return "checkout"; if (hook.includes("cart")) return "cart"; if (hook.includes("order")) return "order"; if (hook.includes("product")) return "product"; return "woocommerce.runtime" }
function orderLifecycle(method: string): string { if (method === "payment_complete") return "order.payment_complete"; if (method.includes("status")) return "order.status_transition"; if (method === "save") return "order.persist"; if (method === "delete") return "order.delete"; return "order.mutate" }
function isWooCommerceStateKey(key: string): boolean { return /^(?:_?woocommerce_|_?wc_)/i.test(key) }
