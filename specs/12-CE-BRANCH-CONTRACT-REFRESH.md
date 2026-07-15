# 12 CE Branch Contract Refresh

## Goal

Make the branch comparison reproducible and accurate before adding IIR-specific
claims.

## Required changes on `ce`

1. Replace the copied baseline README with CE-branch instructions. It must say
   what is installed, what is experimental, and how a user runs the paired
   benchmark.
2. Replace stale setup instructions. In particular, do not instruct users to
   copy a PHP plugin unless the release bundle actually contains one.
3. Add `scripts/ce-index.sh`, `scripts/ce-reset.sh`, and `scripts/ce-doctor.sh`.
   They must use an explicit data directory and print the CE version, installed
   plugins, plugin hashes, source SHAs, and effective config.
4. Add checked-in query/semantic fixture directories:

   ```text
   demo/iir/intents/
   demo/iir/expected/
   demo/iir/fixtures/
   demo/iir/reports/
   ```

   Generated databases, indexes, and runtime logs stay ignored.
5. Make the demo-contract workflow require the CE-only assets above, while
   continuing to prohibit them on `main`.

## Configuration contract

`ce.yaml` must name the source constellation, data location, and enabled
plugins. It must not imply that a language is semantically supported merely
because files of that language are indexed.

The setup report distinguishes:

| Status | Meaning |
| --- | --- |
| indexed | Structural symbols/relationships are available. |
| lifted-partial | Function intent is useful navigation evidence but cannot prove mandatory semantics. |
| lifted-modeled | Claims and source evidence may satisfy modeled verification obligations. |
| unsupported | The language or construct is not a semantic verification target. |

## Acceptance criteria

- A fresh checkout can run `ce-doctor`, index, and reset without undocumented
  local paths.
- `main` remains free of CE setup and semantic artifacts.
- The CE README, agent guide, and contract CI agree on the actual files and
  available plugin capabilities.

