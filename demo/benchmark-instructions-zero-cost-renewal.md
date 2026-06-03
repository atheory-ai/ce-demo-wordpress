# Benchmark Instructions: Zero-Cost Renewal Draft Order Regression

## Goal

Compare how well a fresh AI agent understands an arcane real WooCommerce issue
without Context Engine versus with Context Engine.

Task: `demo/tasks/06-zero-cost-renewal-draft-order.md`

Primary scoring is correctness:

- Does the agent identify the actual draft-order selection/reuse path?
- Does it avoid overfitting to the reporter's suggested `needs_payment()` fix?
- Does it find non-obvious related files and tests?
- Does it distinguish Store API behavior from broad order-status semantics?
- Does it produce a safe, source-backed fix strategy?
- Most importantly: does CE catch subtle or major source facts that the baseline
  misses, or prevent a plausible but wrong baseline explanation?

Secondary measurements:

- time to context-ready
- broad lookup/search requests
- CE tool/harness requests
- files read
- files cited
- missed critical context
- unsupported claims

## Baseline Run

Use a fresh subagent with no prior context.

Give the agent only:

- the baseline worktree path
- the task text
- this instruction: use ordinary source discovery only; do not use Context
  Engine, CE outputs, prior findings, or benchmark notes

Allowed:

- `rg`, `find`, `ls`, and file reads
- broad source search as needed

Stop condition:

- stop when context-ready
- do not edit files
- report elapsed time, lookup/search action count, files read/cited,
  relationship coverage, likely missed context, unsupported-claim risk, and a
  source-cited root-cause/fix plan

## CE-Assisted Run

Use a different fresh subagent with no prior context and no baseline findings.

Give the agent only:

- the CE worktree path
- the same task text
- this instruction: use Context Engine first for source understanding

Required:

- run from the CE worktree root
- use the supplied CE binary and data directory
- use CE/harness outputs for discovery and navigation before source reads
- avoid broad `rg`, `find`, `ls`, shell search, and bulk file reads for
  investigation
- after CE identifies a specific file, symbol, method, reference, call path, or
  source range, inspect that narrow source; every manual read must be traceable
  to a CE result
- use source text for detailed reasoning after CE has narrowed the target
- stop and report a CE blocker if CE cannot surface useful references

Stop condition:

- stop when context-ready
- do not edit files
- report elapsed time after setup, CE request count, broad fallback count,
  files read/cited, relationship coverage, likely missed context,
  unsupported-claim risk, and a source-cited root-cause/fix plan

## Correctness Comparison

Prefer the answer that:

- identifies the most specific source path
- rejects unsafe broad semantic changes when appropriate
- names the right test surface
- distinguishes symptom from root cause
- explains uncertainty and risk clearly
- explicitly names what it found that the other run missed

Do not claim CE wins because it is faster. Claim CE wins only if it produces a
more correct, deeper, or safer diagnosis. The comparison report must include a
`Correctness Delta` section listing:

- major facts caught only by CE
- subtle facts caught only by CE
- major facts caught only by baseline
- subtle facts caught only by baseline
- incorrect or unsupported claims in either answer
- whether the CE-only findings materially improve the final diagnosis or fix
