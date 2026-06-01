# Benchmark Instructions: Store API Headless Cart Merge Regression

## Goal

Compare how well a fresh AI agent understands an arcane real WooCommerce issue
without Context Engine versus with Context Engine.

Task: `demo/tasks/07-store-api-headless-cart-merge.md`

Primary scoring is correctness and depth. Time, request count, and file count
must be recorded, but they are telemetry rather than weighted performance
metrics unless they are so extreme that the task becomes impractical.

Score whether CE improves investigation quality:

- Does the agent identify the actual Store API cart/session/auth flow?
- Does it avoid treating `wp_set_current_user()` as the fix without explaining
  why that changes behavior?
- Does it find non-obvious related files and tests?
- Does it distinguish authentication from login/session side effects?
- Does it produce a safe, source-backed fix strategy for headless Store API
  consumers?

Telemetry to record:

- time to context-ready
- broad lookup/search requests
- CE/harness requests
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

- identifies the most specific Store API request/bootstrap path
- explains how cart token, nonce, current user, and cart session state interact
- rejects unsafe broad auth or session changes when appropriate
- names the right PHP and Store API test surfaces
- distinguishes symptom from root cause
- explains uncertainty and runtime-reproduction risk clearly

Do not claim CE wins because it is faster. Claim CE wins only if it produces a
more correct, deeper, or safer diagnosis.
