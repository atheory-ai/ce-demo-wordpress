# Bounded IIR Walkthrough

This directory is the semantic part of the WordPress demo. It intentionally
uses a small TypeScript client-side cache/update operation related to Task 04,
not a hand-waved claim that the full PHP → REST → Gutenberg lifecycle is
verified.

The walkthrough demonstrates:

```text
declared intent -> deterministic TypeScript source and test artifact
                -> source lift and verification report
```

Run it from the repository root after installing CE:

```sh
scripts/iir-smoke.sh
```

The script writes generated artifacts below ignored `demo/runs/`. They are
deliberately not committed: the checked-in intent is the durable input. IIR
verification uses the CE installation's default language-plugin bundle.

## What it proves

- A declared `FunctionIntent` can specify inputs, behavior, failure, and an
  observable cache effect.
- CE can deterministically generate TypeScript and a test artifact from that
  intent, then compare generated source with the declaration.
- The report is an inspectable contract, not an LLM assertion.

The positive fixture includes a normalized `whenExpr` alongside its readable
`when` text. That is deliberate: a passing behavior comparison requires a
structured condition that CE can render and re-extract. A prose-only condition
is not sufficient semantic evidence and is tracked as a CE soundness issue.

## What it does not prove

- That a Gutenberg store performs this exact operation today.
- PHP, WordPress hooks, REST authorization, or WooCommerce behavior.
- That the generated test artifact has run in an upstream test suite.
- Whole-program semantic equivalence.

For a negative or inconclusive semantic demonstration, extend this fixture only
when its expected result is checked into `expected/` with source and coverage
evidence. The current public CE surface does not yet expose durable
semantic-plan lineage as a CLI query, so the broader specs retain that as a
release gate.
