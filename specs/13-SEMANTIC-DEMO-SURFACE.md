# 13 Semantic Demo Surface

## Goal

Expose the semantic pipeline through a stable, inspectable surface suitable for
the demo. The demo must not reach into CE internal storage packages or present
an experimental one-off command as a stable product workflow.

## Required CE capabilities

Provide a public CLI, MCP/REST API, or a versioned demo harness with equivalent
operations:

```text
declare/shape intent
resolve plan
show plan revision and evidence
evaluate policies and approvals
lower recipe and test plan
lift observed source semantics
verify and show verdict
show repair plan and semantic diff
```

The surface must identify immutable artifact IDs and preserve the lineage:

```text
semantic unit -> plan revision -> recipe -> source artifact
              -> observed lift -> verification -> repair/test-plan
```

## Output requirements

- JSON for automation and a concise human view for demonstrations.
- Explicit status for each claim: `declared`, `inferred`, `resolved`,
  `verified`, `failed`, or `unknown` as applicable.
- Source evidence paths/spans and resolver confidence.
- Stable policy/rule IDs, finding severity, and any approval required.
- A non-zero outcome for failed verification, but not for an explicit,
  documented `inconclusive` capability boundary.

## Acceptance criteria

- A checked-in intent fixture can be run without a model call.
- An operator can reproduce a plan, recipe, verification report, and semantic
  diff from recorded inputs.
- Durable history is visible through the public surface; it is not only stored
  in the graph database.

