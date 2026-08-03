import {
  semanticCoverage,
  semanticEntity,
  semanticOccurrence,
  semanticRelationship,
  unresolvedSemanticRelationship,
} from "@atheory-ai/ce-plugin-sdk"
import type {
  ExtractionResult,
  Node,
  RawCallEvidence,
  RawControlEvidence,
  RawSemanticCoverageEvidence,
  RawSemanticOccurrenceEvidence,
  RawValueEvidence,
} from "@atheory-ai/ce-plugin-sdk"

const PRODUCER = "com.atheory-ai.wordpress-demo.conventions"

type StateOperation = "read" | "write" | "delete"
type StateAPIContract = {
  operation: StateOperation
  capability: string
  entityKind: string
  keyArg: number
  subjectArg?: number
  valueArg?: number
  groupArg?: number
  entityKindArg?: number
}

const CONTRACTS: Record<string, StateAPIContract> = {}

function contract(apis: string[], definition: StateAPIContract): void {
  for (const api of apis) CONTRACTS[api] = definition
}

for (const [prefix, capability, entityKind] of [
  ["user", "wordpress.state.user_meta", "wordpress.user_meta"],
  ["post", "wordpress.state.post_meta", "wordpress.post_meta"],
  ["term", "wordpress.state.term_meta", "wordpress.term_meta"],
  ["comment", "wordpress.state.comment_meta", "wordpress.comment_meta"],
] as const) {
  contract([`get_${prefix}_meta`], { operation: "read", capability, entityKind, keyArg: 1, subjectArg: 0 })
  contract([`add_${prefix}_meta`, `update_${prefix}_meta`], { operation: "write", capability, entityKind, keyArg: 1, subjectArg: 0, valueArg: 2 })
  contract([`delete_${prefix}_meta`], { operation: "delete", capability, entityKind, keyArg: 1, subjectArg: 0, valueArg: 2 })
}

contract(["get_option"], { operation: "read", capability: "wordpress.state.options", entityKind: "wordpress.option", keyArg: 0 })
contract(["add_option", "update_option"], { operation: "write", capability: "wordpress.state.options", entityKind: "wordpress.option", keyArg: 0, valueArg: 1 })
contract(["delete_option"], { operation: "delete", capability: "wordpress.state.options", entityKind: "wordpress.option", keyArg: 0 })
contract(["get_site_option"], { operation: "read", capability: "wordpress.state.site_options", entityKind: "wordpress.site_option", keyArg: 0 })
contract(["add_site_option", "update_site_option"], { operation: "write", capability: "wordpress.state.site_options", entityKind: "wordpress.site_option", keyArg: 0, valueArg: 1 })
contract(["delete_site_option"], { operation: "delete", capability: "wordpress.state.site_options", entityKind: "wordpress.site_option", keyArg: 0 })
contract(["get_network_option"], { operation: "read", capability: "wordpress.state.site_options", entityKind: "wordpress.site_option", subjectArg: 0, keyArg: 1 })
contract(["add_network_option", "update_network_option"], { operation: "write", capability: "wordpress.state.site_options", entityKind: "wordpress.site_option", subjectArg: 0, keyArg: 1, valueArg: 2 })
contract(["delete_network_option"], { operation: "delete", capability: "wordpress.state.site_options", entityKind: "wordpress.site_option", subjectArg: 0, keyArg: 1 })
contract(["get_transient"], { operation: "read", capability: "wordpress.state.transients", entityKind: "wordpress.transient", keyArg: 0 })
contract(["set_transient"], { operation: "write", capability: "wordpress.state.transients", entityKind: "wordpress.transient", keyArg: 0, valueArg: 1 })
contract(["delete_transient"], { operation: "delete", capability: "wordpress.state.transients", entityKind: "wordpress.transient", keyArg: 0 })
contract(["get_site_transient"], { operation: "read", capability: "wordpress.state.site_transients", entityKind: "wordpress.site_transient", keyArg: 0 })
contract(["set_site_transient"], { operation: "write", capability: "wordpress.state.site_transients", entityKind: "wordpress.site_transient", keyArg: 0, valueArg: 1 })
contract(["delete_site_transient"], { operation: "delete", capability: "wordpress.state.site_transients", entityKind: "wordpress.site_transient", keyArg: 0 })
contract(["wp_cache_get"], { operation: "read", capability: "wordpress.state.object_cache", entityKind: "wordpress.object_cache", keyArg: 0, groupArg: 1 })
contract(["wp_cache_add", "wp_cache_set", "wp_cache_replace"], { operation: "write", capability: "wordpress.state.object_cache", entityKind: "wordpress.object_cache", keyArg: 0, valueArg: 1, groupArg: 2 })
contract(["wp_cache_delete"], { operation: "delete", capability: "wordpress.state.object_cache", entityKind: "wordpress.object_cache", keyArg: 0, groupArg: 1 })
contract(["get_metadata"], { operation: "read", capability: "wordpress.state.metadata", entityKind: "wordpress.metadata", entityKindArg: 0, subjectArg: 1, keyArg: 2 })
contract(["add_metadata", "update_metadata"], { operation: "write", capability: "wordpress.state.metadata", entityKind: "wordpress.metadata", entityKindArg: 0, subjectArg: 1, keyArg: 2, valueArg: 3 })
contract(["delete_metadata"], { operation: "delete", capability: "wordpress.state.metadata", entityKind: "wordpress.metadata", entityKindArg: 0, subjectArg: 1, keyArg: 2, valueArg: 3 })

export const WORDPRESS_STATE_CAPABILITIES = [...new Set(Object.values(CONTRACTS).map((item) => item.capability))].sort()

export function extractWordPressStateEffects(contribution: ExtractionResult | undefined): {
  semantics: RawSemanticOccurrenceEvidence[]
  coverage: RawSemanticCoverageEvidence[]
} {
  const semantics: RawSemanticOccurrenceEvidence[] = []
  const counts = new Map<string, { observed: number; emitted: number; unresolved: number }>()
  const controls = contribution?.evidence?.controls ?? []
  const nodes = contribution?.nodes ?? []
  for (const call of contribution?.evidence?.calls ?? []) {
    const api = normalizeAPI(call.callee_expression)
    const definition = CONTRACTS[api]
    if (!definition) continue
    const count = counts.get(definition.capability) ?? { observed: 0, emitted: 0, unresolved: 0 }
    count.observed++
    const keyValue = call.arguments?.[definition.keyArg]
    const groupValue = definition.groupArg === undefined ? undefined : call.arguments?.[definition.groupArg]
    const kindValue = definition.entityKindArg === undefined ? undefined : call.arguments?.[definition.entityKindArg]
    const literalKey = literalValue(keyValue)
    const literalGroup = literalValue(groupValue)
    const literalKind = literalValue(kindValue)
    const entityKind = literalKind ? `wordpress.${literalKind}_meta` : definition.entityKind
    const entityKey = literalKey
      ? definition.groupArg === undefined ? literalKey : `${literalGroup ?? "default"}:${literalKey}`
      : undefined
    const relation = `${definition.operation}s_state`
    const keyExpression = keyValue?.expression ?? "<missing key argument>"
    const relationships = entityKey
      ? [semanticRelationship(relation, semanticEntity(entityKind, entityKey), { method: "framework-api-literal-argument", confidence: "high" })]
      : [unresolvedSemanticRelationship(relation, keyExpression, keyValue ? "dynamic" : "unsupported")]
    const owner = structuralOwner(call, nodes)
    const guards = guardControlsForResult(call, controls)
    const subject = definition.subjectArg === undefined ? undefined : call.arguments?.[definition.subjectArg]
    const value = definition.valueArg === undefined ? undefined : call.arguments?.[definition.valueArg]
    semantics.push(semanticOccurrence({
      producer: PRODUCER,
      kind: `wordpress.state_${definition.operation}`,
      label: `${definition.operation} ${entityKey ?? keyExpression}`,
      entityKind: entityKey ? entityKind : undefined,
      entityKey,
      status: entityKey ? "resolved" : keyValue ? "dynamic" : "unsupported",
      confidence: entityKey ? "high" : "low",
      evidenceSource: "source-mechanics/v1",
      startByte: call.start_byte,
      endByte: call.end_byte,
      enclosingStartByte: owner?.startByte,
      relationships,
      properties: compactProperties({
        api,
        operation: definition.operation,
        resource_kind: entityKind,
        key_expression: keyExpression,
        subject_expression: subject?.expression,
        value_expression: value?.expression,
        result_symbol: call.result?.symbol,
        control_ids: call.control_ids?.join(","),
        guards_control_ids: guards.map((control) => control.id).filter(Boolean).join(","),
        enclosing_callable: owner?.canonicalID,
      }),
    }))
    count.emitted++
    if (!entityKey) count.unresolved++
    counts.set(definition.capability, count)
  }
  const coverage = WORDPRESS_STATE_CAPABILITIES.map((capability) => {
    const count = counts.get(capability) ?? { observed: 0, emitted: 0, unresolved: 0 }
    return semanticCoverage(PRODUCER, capability, count.observed === 0 ? "not_applicable" : count.unresolved === 0 ? "complete" : "partial", count)
  })
  return { semantics, coverage }
}

function normalizeAPI(value: string): string {
  return value.trim().replace(/^\\+/, "").toLowerCase()
}

function literalValue(value: RawValueEvidence | undefined): string | undefined {
  if (!value || value.kind !== "literal") return undefined
  return value.literal
}

function structuralOwner(call: RawCallEvidence, nodes: Node[]): { canonicalID: string; startByte: number } | undefined {
  const node = nodes.find((candidate) => candidate.id === call.caller_node_id)
  if (!node?.canonicalID) return undefined
  const startByte = Number(node.properties?.start_byte)
  return Number.isFinite(startByte) ? { canonicalID: node.canonicalID, startByte } : undefined
}

function guardControlsForResult(call: RawCallEvidence, controls: RawControlEvidence[]): RawControlEvidence[] {
  const symbol = call.result?.symbol
  if (!symbol) return []
  return controls.filter((control) => control.caller_node_id === call.caller_node_id && expressionMentions(control.condition.expression, symbol))
}

function expressionMentions(expression: string, symbol: string): boolean {
  if (!expression || !symbol) return false
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`).test(expression)
}

function compactProperties(input: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ""))
}
