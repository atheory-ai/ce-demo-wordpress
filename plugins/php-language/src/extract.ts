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
        // tree-sitter PHP grammar versions serialize a namespace declaration
        // either with a `name` field or as an unfielded namespace_name child.
        // Do not silently fall back to global: canonical symbol identity must
        // preserve the declaration scope in both CST shapes.
        const declaredNamespace = childByField(node, "name")?.text
          ?? firstDescendantByType(node, "namespace_name")?.text
          ?? firstDescendantByType(node, "qualified_name")?.text
          ?? namespaceFromDeclarationText(node.text)
          ?? namespaceFromDeclarationText(content.slice(node.startByte, node.endByte))
          ?? ""
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
        const declarationNamespace = namespaceName || namespaceAtOffset(content, node.startByte)
        addSymbol(name, node.type.replace("_declaration", ""), node, { extends: parent }, declarationNamespace)
        for (const child of node.children ?? []) visit(child, name, declarationNamespace)
        return
      }
      case "method_declaration": {
        const name = childByField(node, "name")?.text ?? ""
        if (name) addSymbol(className ? `${className}.${name}` : name, "method", node, { visibility: visibility(node) }, namespaceName || namespaceAtOffset(content, node.startByte))
        break
      }
      case "function_definition": {
        const name = childByField(node, "name")?.text ?? ""
        if (name) addSymbol(name, "function", node, {}, namespaceName || namespaceAtOffset(content, node.startByte))
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

// The grammar has changed the child shape of namespace_definition across
// releases. The enclosing node is already grammar-recognized, so this is only
// a lexical fallback for its direct declaration payload—not a regex-based PHP
// semantic extractor.
function namespaceFromDeclarationText(text: string): string | undefined {
  const match = /^\s*namespace\s+([A-Za-z_][A-Za-z0-9_\\]*)\s*[;{]/.exec(text)
  if (match?.[1]) return match[1]
  return /^[A-Za-z_][A-Za-z0-9_\\]*$/.test(text) ? text : undefined
}

// Fallback for grammar versions that wrap PHP namespace declarations in a
// node shape the SDK serializer does not expose. It is used only when the CST
// traversal has no namespace context, and selects the declaration in scope for
// this declaration's source offset (including files with several namespaces).
function namespaceAtOffset(content: string, offset: number): string {
  const prefix = content.slice(0, offset)
  const matches = [...prefix.matchAll(/\bnamespace\s+([A-Za-z_][A-Za-z0-9_\\]*)\s*[;{]/g)]
  return matches.at(-1)?.[1] ?? ""
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
