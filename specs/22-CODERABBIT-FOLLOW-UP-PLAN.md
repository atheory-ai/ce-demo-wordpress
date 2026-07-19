# 22 — CodeRabbit Follow-up Plan

## Purpose

Close the remaining valid findings from the semantic-composition review without
mixing structural-identity or destructive-command changes into the vocabulary
release.

## Status

All three workstreams below are implemented on the semantic-composition branch;
their regression coverage and documentation changes ship with the follow-up.

## Workstream 1 — PHP structural identity hardening

### Problem

`plugins/php-language/src/extract.ts` derives a symbol identity from a directory
and name. A root-level path is truncated by the current directory calculation,
and same-named symbols in separate files in one directory can collapse to one
graph node.

### Changes

1. Derive the directory safely when a path has no slash.
2. Define a canonical symbol format containing the full project-relative file
   path plus declaration context (namespace and enclosing class when present).
3. Keep `defines` edges bound to the file's own symbol node.
4. Document the identity format as a stable plugin contract.

### Acceptance tests

- A root-level PHP path retains its entire filename.
- Two files in one directory with the same un-namespaced declaration produce
  distinct node IDs and correct `defines` edges.
- Same-named declarations in distinct namespaces remain distinct.

## Workstream 2 — CE data reset containment

### Problem

`scripts/ce-reset.sh` checks the textual prefix of `CE_DATA_DIR` before
`rm -rf`; a value containing `..` can satisfy that prefix while resolving
outside `demo/runs`.

### Changes

1. Reject traversal path components before deletion.
2. Resolve the target and allowed `demo/runs` root using a portable,
   non-destructive normalization strategy.
3. Require the resolved target to remain a strict descendant of the resolved
   allowed root.
4. Preserve the existing `--yes` gate and refusal messages.

### Acceptance tests

- Valid nested run data is removed only with `--yes`.
- Paths containing `..`, a sibling directory, the repository root, and `/` are
  rejected without deleting any fixture.

## Workstream 3 — Capability and fixture documentation alignment

### Changes

1. Add zero-file indexing and failed graph-query states to the guided CE stop
   conditions.
2. State in the PHP plugin authoring validation that grammar construction is
   demo-owned and does not imply universal CE PHP semantic verification.
3. Move the TypeScript IIR pilot's negative and inconclusive fixture criteria to
   a future milestone, unless those checked-in fixtures and deterministic CI
   artifacts are added in the same change.
4. Apply markdown-only nits (fence language and glob formatting) opportunistically.

### Acceptance tests

- Documentation names a release blocker for zero-file and unqueryable indexes.
- Current fixture claims and pilot acceptance criteria describe the same
  checked-in artifact set.
