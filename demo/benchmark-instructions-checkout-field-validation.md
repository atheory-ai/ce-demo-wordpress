# Benchmark Instructions: Checkout Field Validation

## Goal

Compare how well an AI agent understands this repository without Context Engine
versus with Context Engine.

The benchmark measures the agent's ability to become context-ready for:

`demo/tasks/02-checkout-field-validation.md`

Measure:

- elapsed time to context-ready
- number of broad lookup/search requests
- number of CE tool/harness requests
- files read
- files cited
- depth of relationship understanding
- accuracy of source-backed claims
- missed critical context
- unsupported or weak claims
- quality of the final implementation/investigation plan
- subtle or major source facts CE catches that the baseline misses, and subtle
  or major source facts the baseline catches that CE misses

Indexing time is setup overhead. Record it separately, but do not treat it as
the agent's context-acquisition time.

## Baseline Run

Use a fresh subagent with no prior context.

Give the agent only:

- the baseline worktree path
- the task file path
- this instruction: use ordinary source discovery only; do not use Context
  Engine, CE outputs, prior findings, or benchmark notes

Allowed:

- `rg`, `find`, `ls`, and file reads
- narrow or broad source search as needed

Stop condition:

- stop when context-ready
- do not edit files
- report elapsed time, lookup/search action count, files read/cited,
  relationships found, likely missed context, unsupported-claim risk, and a
  concise source-cited plan

## CE-Assisted Run

Use a different fresh subagent with no prior context and no baseline findings.

Give the agent only:

- the CE worktree path
- the same task file path
- this instruction: use Context Engine first for source understanding

Required:

- run from the CE worktree root
- use the configured CE data directory and CE binary supplied by the operator
- use CE/harness outputs for discovery and navigation before source reads
- avoid broad `rg`, `find`, `ls`, shell search, and bulk file reads for
  investigation
- after CE identifies a specific file, symbol, method, reference, call path, or
  source range, inspect that narrow source; every manual read must be traceable
  to a CE result
- use source text for detailed reasoning after CE has narrowed the target
- if CE fails to index, query, search, or surface useful references, stop and
  report a CE blocker instead of completing the task with broad source search

Allowed:

- narrow file reads for CE-cited paths, symbols, methods, references, call paths,
  or source ranges
- setup checks needed to confirm CE data/plugin availability

Stop condition:

- stop when context-ready
- do not edit files
- report elapsed time after CE setup, CE request count, broad fallback count,
  files read/cited, relationships found, likely missed context,
  unsupported-claim risk, and a concise source-cited plan

## Correctness Comparison

Compare the two reports on:

- source coverage
- cross-file and cross-language relationship accuracy
- missed critical context
- subtle facts caught by only one run
- major facts caught by only one run
- unsupported claims
- plan quality

Record speed to context-ready and request/action count as telemetry. Do not
weight them above correctness unless one path is so slow or noisy that the task
becomes impractical.

Do not claim CE is better unless the CE-assisted run is valid and shows a
measurable improvement in source coverage, relationship accuracy, missed
context, subtle source facts caught, major source facts caught, unsupported
claims avoided, or plan quality. The comparison report must include a
`Correctness Delta` section listing:

- major facts caught only by CE
- subtle facts caught only by CE
- major facts caught only by baseline
- subtle facts caught only by baseline
- incorrect or unsupported claims in either answer
- whether the CE-only findings materially improve the final diagnosis or plan
