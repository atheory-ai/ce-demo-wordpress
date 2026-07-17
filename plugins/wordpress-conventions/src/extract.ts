import { childByField, edgeID, firstDescendantByType, nodeID, walk } from "@atheory-ai/ce-plugin-sdk"
import type { Edge, ExtractionResult, LanguageDefinition, Node, SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

const HOOK_APIS = new Set(["add_action", "add_filter", "do_action", "apply_filters"])

export const extract: LanguageDefinition["extract"] = (filePath, _content, tree): ExtractionResult => {
  if (!tree) return { nodes: [], edges: [] }
  const nodes: Node[] = []
  const edges: Edge[] = []
  const fileID = nodeID("", "file", filePath)

  walk(tree, (call) => {
    if (call.type !== "function_call_expression") return
    // PHP grammars before and after the current CE corpus expose the same
    // named children; prefer field names but tolerate a grammar that omits
    // them from its serialized CST.
    const functionNode = childByField(call, "function") ?? (call.children ?? []).find((child) =>
      child.type === "name" || child.type === "qualified_name",
    )
    const functionName = normalizeCallName(functionNode?.text ?? "")
    const argumentsNode = childByField(call, "arguments") ?? (call.children ?? []).find((child) => child.type === "arguments")
    const argumentsList = (argumentsNode?.children ?? []).filter((child) => child.isNamed)

    if (HOOK_APIS.has(functionName)) {
      const hook = stringValue(argumentsList[0])
      if (!hook) return
      const direction = functionName.startsWith("add_") ? "registration" : "dispatch"
      addFact(nodes, edges, fileID, {
        filePath, call, type: "wordpress_hook", label: hook,
        canonicalID: `wordpress:hook:${direction}:${hook}:${filePath}:${call.startByte}`,
        properties: {
          api: functionName, hook, direction,
          callback: argumentsList[1]?.text ?? undefined,
          priority: argumentsList[2]?.text ?? undefined,
          family: hook.startsWith("woocommerce_") ? "woocommerce" : "wordpress",
        },
      })
      return
    }

    if (functionName === "register_rest_route") {
      const namespace = stringValue(argumentsList[0])
      const route = stringValue(argumentsList[1])
      if (!namespace || !route) return
      addFact(nodes, edges, fileID, {
        filePath, call, type: "wordpress_route", label: `${namespace}${route}`,
        canonicalID: `wordpress:route:${namespace}${route}:${filePath}:${call.startByte}`,
        properties: { api: functionName, namespace, route, options: argumentsList[2]?.text ?? undefined },
      })
      return
    }

    if (functionName === "register_block_type") {
      const block = stringValue(argumentsList[0])
      if (!block) return
      addFact(nodes, edges, fileID, {
        filePath, call, type: "wordpress_block", label: block,
        canonicalID: `wordpress:block:${block}:${filePath}:${call.startByte}`,
        properties: { api: functionName, block, settings: argumentsList[1]?.text ?? undefined },
      })
    }
  })

  return deduplicate(nodes, edges)
}

function normalizeCallName(name: string): string {
  return name.replace(/^\\+/, "").toLowerCase()
}

function stringValue(node: SyntaxNode | undefined): string {
  if (!node) return ""
  const string = node.type === "string" ? node : firstDescendantByType(node, "string")
  return string?.text.replace(/^(?:'|")|(?:'|")$/g, "") ?? ""
}

function addFact(nodes: Node[], edges: Edge[], fileID: string, fact: {
  filePath: string
  call: SyntaxNode
  type: string
  label: string
  canonicalID: string
  properties: Record<string, unknown>
}): void {
  const id = nodeID("", fact.type, fact.canonicalID)
  nodes.push({
    id, type: fact.type, label: fact.label, canonicalID: fact.canonicalID,
    sourceClass: "structural",
    properties: { file_path: fact.filePath, start_byte: fact.call.startByte, start_line: fact.call.startPosition.row, ...fact.properties },
  })
  edges.push({
    id: edgeID(fileID, "contains", id), sourceID: fileID, targetID: id,
    type: "contains", sourceClass: "structural", properties: {},
  })
}

function deduplicate(nodes: Node[], edges: Edge[]): ExtractionResult {
  const nodeIDs = new Set<string>()
  const edgeIDs = new Set<string>()
  return {
    nodes: nodes.filter((node) => !nodeIDs.has(node.id) && (nodeIDs.add(node.id), true)),
    edges: edges.filter((edge) => !edgeIDs.has(edge.id) && (edgeIDs.add(edge.id), true)),
  }
}
