import {
  childByField,
  edgeID,
  firstDescendantByType,
  nodeID,
} from "@atheory-ai/ce-plugin-sdk"
import type { Edge, ExtractionResult, LanguageDefinition, Node, SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

export const extract: LanguageDefinition["extract"] = (filePath, content, tree): ExtractionResult => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const fileID = nodeID("", "file", filePath)

  nodes.push({
    id: fileID, type: "file", label: filePath.split("/").pop() ?? filePath,
    canonicalID: filePath, sourceClass: "structural",
    properties: { extension: filePath.slice(filePath.lastIndexOf(".")), line_count: content.split("\n").length },
  })
  if (!tree) return { nodes, edges }

  const addSymbol = (
    name: string,
    kind: string,
    node: SyntaxNode,
    extra: Record<string, unknown> = {},
    namespaceName = "",
  ): string => {
    const canonicalID = symbolCanonicalID(filePath, namespaceName, kind, name)
    const id = nodeID("", "symbol", canonicalID)
    nodes.push({
      id, type: "symbol", label: name, canonicalID, sourceClass: "structural",
      properties: { file_path: filePath, kind, start_byte: node.startByte, start_line: node.startPosition.row, ...extra },
    })
    edges.push({
      id: edgeID(fileID, "defines", id), sourceID: fileID, targetID: id,
      type: "defines", sourceClass: "structural", properties: {},
    })
    return id
  }

  const addNamespace = (name: string, node: SyntaxNode, importPath = false): void => {
    if (!name) return
    const id = nodeID("", "namespace", name)
    nodes.push({
      id, type: "namespace", label: name.split("\\").pop() ?? name, canonicalID: name,
      sourceClass: "structural", properties: { file_path: filePath, ...(importPath ? { import_path: name } : { start_byte: node.startByte }) },
    })
    edges.push({
      id: edgeID(fileID, importPath ? "imports" : "defines", id), sourceID: fileID, targetID: id,
      type: importPath ? "imports" : "defines", sourceClass: "structural", properties: {},
    })
  }

  const visit = (node: SyntaxNode, className = "", namespaceName = ""): void => {
    switch (node.type) {
      case "namespace_definition": {
        const declaredNamespace = childByField(node, "name")?.text ?? ""
        addNamespace(declaredNamespace, node)
        for (const child of node.children ?? []) visit(child, "", declaredNamespace)
        return
      }
      case "namespace_use_declaration":
        for (const clause of (node.children ?? []).filter((child) => child.type === "namespace_use_clause")) {
          addNamespace(firstDescendantByType(clause, "qualified_name")?.text ?? firstDescendantByType(clause, "name")?.text ?? "", clause, true)
        }
        break
      case "class_declaration":
      case "interface_declaration":
      case "trait_declaration":
      case "enum_declaration": {
        const name = childByField(node, "name")?.text ?? ""
        if (!name) break
        const base = firstDescendantByType(node, "base_clause")
        const parent = base ? (firstDescendantByType(base, "qualified_name")?.text ?? firstDescendantByType(base, "name")?.text) : undefined
        // A superclass can be external to the indexed slice. Preserve it as
        // metadata rather than emitting an edge to a node not established here.
        addSymbol(name, node.type.replace("_declaration", ""), node, { extends: parent }, namespaceName)
        for (const child of node.children ?? []) visit(child, name, namespaceName)
        return
      }
      case "method_declaration": {
        const name = childByField(node, "name")?.text ?? ""
        if (name) addSymbol(className ? `${className}.${name}` : name, "method", node, { visibility: visibility(node) }, namespaceName)
        break
      }
      case "function_definition": {
        const name = childByField(node, "name")?.text ?? ""
        if (name) addSymbol(name, "function", node, {}, namespaceName)
        break
      }
    }
    for (const child of node.children ?? []) visit(child, className, namespaceName)
  }

  visit(tree)
  return deduplicate(nodes, edges)
}

// Symbol IDs must remain unique across source files and PHP declaration scopes.
// The format is documented for the demo plugin because it is part of the
// persisted graph identity, not just a display value.
function symbolCanonicalID(filePath: string, namespaceName: string, kind: string, name: string): string {
  return `${filePath}:${namespaceName || "global"}:${kind}:${name}`
}

function visibility(node: SyntaxNode): string | undefined {
  return (node.children ?? []).find((child) => child.type === "visibility_modifier")?.text
}

function deduplicate(nodes: Node[], edges: Edge[]): ExtractionResult {
  const nodeIDs = new Set<string>()
  const edgeIDs = new Set<string>()
  return {
    nodes: nodes.filter((node) => !nodeIDs.has(node.id) && (nodeIDs.add(node.id), true)),
    edges: edges.filter((edge) => !edgeIDs.has(edge.id) && (edgeIDs.add(edge.id), true)),
  }
}
