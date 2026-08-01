import {
  childByField,
  edgeID,
  firstDescendantByType,
  nodeID,
  semanticCoverage,
  semanticOccurrence,
  semanticRelationship,
  sourceCallEvidence,
  sourceCallScopeEvidence,
  sourceReferenceEvidence,
  structuralEntity,
  unresolvedSemanticRelationship,
  walk,
} from "@atheory-ai/ce-plugin-sdk"
import type { Edge, ExtractionResult, LanguageDefinition, Node, RawEvidence, SyntaxNode } from "@atheory-ai/ce-plugin-sdk"

export const extract: LanguageDefinition["extract"] = (filePath, content, tree): ExtractionResult => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const evidence: RawEvidence = {}
  let heritageObserved = 0
  let heritageUnresolved = 0
  const fileID = nodeID("", "file", filePath)

  nodes.push({
    id: fileID, type: "file", label: filePath.split("/").pop() ?? filePath,
    canonicalID: filePath, sourceClass: "structural",
    properties: { extension: filePath.slice(filePath.lastIndexOf(".")), line_count: content.split("\n").length },
  })
  if (!tree) {
    evidence.semantic_coverage = [semanticCoverage("com.atheory-ai.wordpress-demo.php", "language.class_heritage", "unavailable", { reason: "No PHP CST was available." })]
    return { nodes, edges, evidence }
  }
  const namespaceDeclarations = collectNamespaceDeclarations(content)
  const callBindings = collectPHPCallBindings(tree, namespaceDeclarations)

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

  const addNamespace = (name: string, node: SyntaxNode): void => {
    if (!name) return
    const id = nodeID("", "namespace", name)
    nodes.push({
      id, type: "namespace", label: name.split("\\").pop() ?? name, canonicalID: name,
      sourceClass: "structural", properties: { file_path: filePath, start_byte: node.startByte },
    })
    edges.push({
      id: edgeID(fileID, "defines", id), sourceID: fileID, targetID: id,
      type: "defines", sourceClass: "structural", properties: {},
    })
  }

  const addNamespaceReference = (name: string, node: SyntaxNode): void => {
    if (!name) return
    const reference = sourceReferenceEvidence({
      filePath,
      fileID,
      rawSpecifier: name,
      language: "php",
      importForm: "use",
      targetSpace: "namespace",
      startByte: node.startByte,
      endByte: node.endByte,
      ...(phpBindingForClause(name, node) ? { bindings: [phpBindingForClause(name, node)!] } : {}),
    })
    ;(evidence.references ??= []).push(reference)
  }

  const addIncludeReference = (node: SyntaxNode): void => {
    const expression = node.text || content.slice(node.startByte, node.endByte)
    const staticCandidates = staticIncludeCandidates(expression)
    const literal = staticCandidates[0]
    const reference = sourceReferenceEvidence({
      filePath,
      fileID,
      rawSpecifier: expression.trim(),
      language: "php",
      importForm: phpIncludeForm(node.type),
      kind: staticCandidates.length ? "relative_path" : "dynamic",
      targetSpace: "file",
      startByte: node.startByte,
      endByte: node.endByte,
      ...(staticCandidates.length ? { staticCandidates } : {}),
    })
    // A bare literal is both the source expression and the static candidate;
    // keep the source text exact for non-literal __DIR__/dirname expressions.
    if (literal && /^['"]/.test(expression.trim())) reference.raw_specifier = literal
    ;(evidence.references ??= []).push(reference)
  }

  const visit = (
    node: SyntaxNode,
    className = "",
    namespaceName = "",
    callScope?: { callerID: string; ownerClass: string; bindings: Map<string, PHPCallBinding> },
  ): void => {
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
        for (const clause of namespaceUseClauses(node)) {
          let name = firstDescendantByType(clause, "qualified_name")?.text ?? firstDescendantByType(clause, "name")?.text ?? ""
          const prefix = namespaceUsePrefix(node.text)
          if (prefix && name && !name.includes("\\")) name = `${prefix}\\${name}`
          addNamespaceReference(name, clause)
        }
        break
      case "include_expression":
      case "include_once_expression":
      case "require_expression":
      case "require_once_expression":
        addIncludeReference(node)
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
        const declarationNamespace = namespaceName || namespaceAtOffset(namespaceDeclarations, node.startByte)
        addSymbol(name, node.type.replace("_declaration", ""), node, { extends: parent }, declarationNamespace)
        if (parent) {
          heritageObserved++
          const binding = (callBindings.get(declarationNamespace) ?? new Map<string, PHPCallBinding>()).get(parent.split("\\")[0])
          const qualifiedParent = qualifyPHPType(parent, declarationNamespace, binding)
          const relationship = qualifiedParent
            ? semanticRelationship("extends", structuralEntity("symbol", phpQualifiedTypeCanonicalID(qualifiedParent, "class")), { method: binding ? "namespace-import" : "same-namespace", confidence: "high" })
            : unresolvedSemanticRelationship("extends", parent, "unresolved", [parent])
          if (!qualifiedParent) heritageUnresolved++
          ;(evidence.semantics ??= []).push(semanticOccurrence({
            producer: "com.atheory-ai.wordpress-demo.php",
            kind: "language.class_heritage",
            entityKind: "php.class",
            entityKey: phpQualifiedTypeName(declarationNamespace, name) ?? `${filePath}:${name}`,
            label: name,
            startByte: node.startByte,
            endByte: node.endByte,
            relationships: [relationship],
          }))
        }
        for (const child of node.children ?? []) visit(child, name, declarationNamespace, undefined)
        return
      }
      case "method_declaration": {
        const name = childByField(node, "name")?.text ?? ""
        if (name) {
          const declarationNamespace = namespaceName || namespaceAtOffset(namespaceDeclarations, node.startByte)
          const id = addSymbol(className ? `${className}.${name}` : name, "method", node, { visibility: visibility(node) }, declarationNamespace)
          addCallScope(node, id, evidence)
          for (const child of node.children ?? []) visit(child, className, declarationNamespace, {
            callerID: id,
            ownerClass: className,
            bindings: callBindings.get(declarationNamespace) ?? new Map<string, PHPCallBinding>(),
          })
          return
        }
        break
      }
      case "function_definition": {
        const name = childByField(node, "name")?.text ?? ""
        if (name) {
          const declarationNamespace = namespaceName || namespaceAtOffset(namespaceDeclarations, node.startByte)
          const id = addSymbol(name, "function", node, {}, declarationNamespace)
          addCallScope(node, id, evidence)
          for (const child of node.children ?? []) visit(child, className, declarationNamespace, {
            callerID: id,
            ownerClass: "",
            bindings: callBindings.get(declarationNamespace) ?? new Map<string, PHPCallBinding>(),
          })
          return
        }
        break
      }
      case "anonymous_function_creation_expression":
        // Anonymous functions do not yet have a stable symbol anchor. Their
        // calls must not be falsely attributed to the enclosing named scope.
        for (const child of node.children ?? []) visit(child, className, namespaceName, undefined)
        return
    }
    if (callScope) addCall(node, callScope.callerID, callScope.ownerClass, callScope.bindings, evidence)
    for (const child of node.children ?? []) visit(child, className, namespaceName, callScope)
  }

  visit(tree)
  evidence.semantic_coverage = [semanticCoverage(
    "com.atheory-ai.wordpress-demo.php",
    "language.class_heritage",
    heritageObserved === 0 ? "not_applicable" : heritageUnresolved === 0 ? "complete" : "partial",
    { observed: heritageObserved, emitted: heritageObserved, unresolved: heritageUnresolved },
  )]
  return { ...deduplicate(nodes, edges), evidence }
}

// Preserve every call expression owned by a named PHP callable as compact
// host-projected evidence. Structural extraction and call extraction share the
// same CST walk; nested callables replace (or clear) their enclosing scope.
type PHPCallBinding = { specifier: string; remoteName: string }

function collectPHPCallBindings(
  tree: SyntaxNode,
  namespaceDeclarations: Array<{ offset: number; name: string }>,
): Map<string, Map<string, PHPCallBinding>> {
  const bindings = new Map<string, Map<string, PHPCallBinding>>()
  const visit = (declaration: SyntaxNode, namespaceName = ""): void => {
    if (declaration.type === "namespace_definition") {
      const declaredNamespace = childByField(declaration, "name")?.text
        ?? firstDescendantByType(declaration, "namespace_name")?.text
        ?? firstDescendantByType(declaration, "qualified_name")?.text
        ?? namespaceFromDeclarationText(declaration.text)
        ?? namespaceName
      for (const child of declaration.children ?? []) visit(child, declaredNamespace)
      return
    }
    if (declaration.type === "namespace_use_declaration") {
      const scopedNamespace = namespaceName || namespaceAtOffset(namespaceDeclarations, declaration.startByte)
      let scoped = bindings.get(scopedNamespace)
      if (!scoped) {
        scoped = new Map<string, PHPCallBinding>()
        bindings.set(scopedNamespace, scoped)
      }
      const prefix = namespaceUsePrefix(declaration.text)
      for (const clause of namespaceUseClauses(declaration)) {
        let name = firstDescendantByType(clause, "qualified_name")?.text ?? firstDescendantByType(clause, "name")?.text ?? ""
        if (prefix && name && !name.includes("\\")) name = `${prefix}\\${name}`
        const binding = phpBindingForClause(name, clause)
        if (binding) scoped.set(binding.localName, { specifier: name, remoteName: binding.remoteName })
      }
      return
    }
    if (
      declaration.type === "function_definition"
      || declaration.type === "method_declaration"
      || declaration.type === "anonymous_function_creation_expression"
      || declaration.type === "class_declaration"
      || declaration.type === "interface_declaration"
      || declaration.type === "trait_declaration"
      || declaration.type === "enum_declaration"
    ) return
    for (const child of declaration.children ?? []) visit(child, namespaceName)
  }
  visit(tree)
  return bindings
}

function phpBindingForClause(name: string, clause: SyntaxNode): { localName: string; remoteName: string } | undefined {
  if (!name) return undefined
  const remoteName = name.split("\\").at(-1) ?? ""
  const localName = childByField(clause, "alias")?.text ?? remoteName
  return localName && remoteName ? { localName, remoteName } : undefined
}

function addCallScope(callable: SyntaxNode, callerID: string, evidence: RawEvidence): void {
  ;(evidence.call_scopes ??= []).push(sourceCallScopeEvidence({
    filePath: "",
    callerID,
    language: "php",
    startByte: callable.startByte,
    endByte: callable.endByte,
    bodyPresent: !!childByField(callable, "body"),
  }))
}

function addCall(node: SyntaxNode, callerID: string, ownerClass: string, bindings: Map<string, PHPCallBinding>, evidence: RawEvidence): void {
  const detail = phpCallDetail(node, ownerClass, bindings)
  if (!detail) return
  ;(evidence.calls ??= []).push(sourceCallEvidence({
    filePath: "",
    callerID,
    calleeExpression: detail.expression,
    language: "php",
    callKind: detail.kind,
    startByte: node.startByte,
    endByte: node.endByte,
    ...(detail.candidateNames.length ? { candidateNames: detail.candidateNames } : {}),
    ...(detail.referenceSpecifier ? { referenceSpecifier: detail.referenceSpecifier } : {}),
  }))
}

function phpCallDetail(node: SyntaxNode, ownerClass: string, bindings: Map<string, PHPCallBinding>): { expression: string; kind: "local" | "imported" | "constructor" | "method" | "dynamic"; candidateNames: string[]; referenceSpecifier?: string } | undefined {
  if (node.type === "function_call_expression") {
    const callee = childByField(node, "function") ?? childByField(node, "name") ?? (node.children ?? []).find(child => child.isNamed)
    const expression = callee?.text || node.text || "<dynamic call>"
    if (!callee || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(callee.text)) return { expression, kind: "dynamic", candidateNames: [] }
    return { expression, kind: "local", candidateNames: [callee.text] }
  }
  if (node.type === "object_creation_expression") {
    const className = childByField(node, "class") ?? childByField(node, "type") ?? (node.children ?? []).find(child => child.isNamed)
    const expression = className?.text || node.text || "<dynamic constructor>"
    if (!className || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(className.text)) return { expression, kind: "dynamic", candidateNames: [] }
    return { expression, kind: "constructor", candidateNames: [className.text] }
  }
  if (node.type === "member_call_expression" || node.type === "scoped_call_expression") {
    const scope = childByField(node, "object") ?? childByField(node, "scope") ?? (node.children ?? []).find(child => child.isNamed)
    const method = childByField(node, "name") ?? childByField(node, "member") ?? [...(node.children ?? [])].reverse().find(child => child.type === "name" || child.type === "identifier")
    const expression = node.text || "<dynamic method call>"
    const scopeName = scope?.text ?? ""
    const methodName = method?.text ?? ""
    if (!methodName) return { expression, kind: "dynamic", candidateNames: [] }
    if ((scopeName === "$this" || scopeName === "self" || scopeName === "static") && ownerClass) {
      return { expression, kind: "method", candidateNames: [`${ownerClass}.${methodName}`] }
    }
    const imported = bindings.get(scopeName)
    if (imported) return { expression, kind: "imported", candidateNames: [`${imported.remoteName}.${methodName}`], referenceSpecifier: imported.specifier }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(scopeName)) return { expression, kind: "method", candidateNames: [`${scopeName}.${methodName}`] }
    return { expression, kind: "method", candidateNames: [] }
  }
  return undefined
}

function phpIncludeForm(type: string): string {
  return type.replace(/_expression$/, "")
}

function namespaceUseClauses(node: SyntaxNode): SyntaxNode[] {
  const clauses: SyntaxNode[] = []
  walk(node, (child) => {
    if (child.type === "namespace_use_clause") clauses.push(child)
  })
  return clauses
}

function namespaceUsePrefix(text: string): string | undefined {
  return /^\s*use\s+([A-Za-z_][A-Za-z0-9_\\]*)\\\s*\{/.exec(text)?.[1]
}

// The enclosing node is already a grammar-recognized include/require
// expression. This recognises only literals and the two stable directory
// anchors PHP projects commonly use; all other expressions remain explicitly
// dynamic rather than guessed.
function staticIncludeCandidates(expression: string): string[] {
  const trimmed = expression.trim()
  const literal = /^(?:include|include_once|require|require_once)\s*\(?\s*['"]([^'"]+)['"]\s*\)?\s*;?$/.exec(trimmed)
  if (literal?.[1]) return [literal[1]]
  const directory = /^(?:include|include_once|require|require_once)\s*\(?\s*(?:__DIR__|dirname\(\s*__FILE__\s*\))\s*\.\s*['"]([^'"]+)['"]\s*\)?\s*;?$/.exec(trimmed)
  if (directory?.[1]) return ["." + directory[1].replace(/^\/+/, "/")]
  return []
}

// Symbol IDs must remain unique across source files and PHP declaration scopes.
// The format is documented for the demo plugin because it is part of the
// persisted graph identity, not just a display value.
function symbolCanonicalID(filePath: string, namespaceName: string, kind: string, name: string): string {
  return namespaceName ? `${namespaceName}:${kind}:${name}` : `${filePath}:global:${kind}:${name}`
}

function phpQualifiedTypeName(namespaceName: string, name: string): string | undefined {
  const normalizedNamespace = namespaceName.replace(/^\\+|\\+$/g, "")
  const normalizedName = name.replace(/^\\+/, "")
  if (!normalizedName) return undefined
  return normalizedNamespace ? `${normalizedNamespace}\\${normalizedName}` : undefined
}

function qualifyPHPType(name: string, namespaceName: string, binding?: PHPCallBinding): string | undefined {
  const normalized = name.replace(/^\\+/, "")
  if (!normalized) return undefined
  if (name.startsWith("\\") || normalized.includes("\\")) return normalized
  if (binding) {
    const imported = binding.specifier.replace(/^\\+/, "")
    return imported || undefined
  }
  return phpQualifiedTypeName(namespaceName, normalized)
}

function phpQualifiedTypeCanonicalID(qualifiedName: string, kind: string): string {
  const parts = qualifiedName.replace(/^\\+/, "").split("\\")
  const name = parts.pop() ?? qualifiedName
  return `${parts.join("\\")}:${kind}:${name}`
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
function collectNamespaceDeclarations(content: string): Array<{ offset: number; name: string }> {
  const declarations: Array<{ offset: number; name: string }> = []
  for (const match of content.matchAll(/\bnamespace\s+([A-Za-z_][A-Za-z0-9_\\]*)\s*[;{]/g)) {
    if (match.index !== undefined && match[1]) declarations.push({ offset: match.index, name: match[1] })
  }
  return declarations
}

function namespaceAtOffset(declarations: Array<{ offset: number; name: string }>, offset: number): string {
  let low = 0
  let high = declarations.length - 1
  let found = ""
  while (low <= high) {
    const middle = (low + high) >>> 1
    if (declarations[middle].offset >= offset) {
      high = middle - 1
    } else {
      found = declarations[middle].name
      low = middle + 1
    }
  }
  return found
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
