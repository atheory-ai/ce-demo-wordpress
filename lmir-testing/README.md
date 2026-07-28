# LMIR / IIR effectiveness study

This directory is an evidence log for testing Context Engine's semantic development claims in the WordPress demo. The current CLI and source call the implemented representation **IIR** (`ce iir`), for *Intermediate Intent Representation*. This study uses “LMIR” as the broader product hypothesis, but records the exact shipped IIR surface tested so that it does not silently claim a capability that has not shipped.

## Claim boundary

The WordPress demo deliberately has two different capabilities:

| Surface | What this study may conclude |
| --- | --- |
| `demo/iir/`, TypeScript `FunctionIntent`, `ce iir` | Function-level declared intent can be generated, lifted, compared, policy-checked, test-planned, and (for bounded defects) deterministically repaired. |
| PHP language + WordPress/WooCommerce convention plugins | Useful source-navigation and convention facts after indexing; **not** modeled IIR evidence or PHP semantic verification. |
| Whole WordPress/Gutenberg/WooCommerce flow | Out of scope. No experiment here proves whole-program equivalence, runtime behavior, REST authorization, or a Gutenberg implementation. |

This separation is intentional. Passing a test below is not a claim that the PHP plugins semantically verify WordPress. Conversely, a semantic pipeline that reports `conditional` because its evidence is partial is correct fail-closed behavior, not a pass.

## Reproducibility

Build the CE revision being evaluated, then run:

```sh
CE_BIN=/absolute/path/to/ce lmir-testing/run-experiments.sh
```

The runner executes every deterministic condition three times in independent processes and writes raw reports under `lmir-testing/results/`. It never indexes the corpus or writes source. Use a new result directory to preserve a prior run:

```sh
CE_BIN=/absolute/path/to/ce lmir-testing/run-experiments.sh lmir-testing/results/YYYY-MM-DD-rerun
```

Read [00-test-strategy.md](./00-test-strategy.md) before interpreting results, and [experiment-log.md](./experiment-log.md) for the run-by-run record.

## Status

The initial false-pass baseline is retained in `results/2026-07-22-evidence/`. The fail-closed regression rerun is recorded in [results/2026-07-22-post-fix/summary.md](./results/2026-07-22-post-fix/summary.md). The first configured model-backed run is recorded in [results/2026-07-22-luna-medium/summary.md](./results/2026-07-22-luna-medium/summary.md): it demonstrates valid natural-language-to-IIR shaping, but its generated source remains `inconclusive` rather than verified. The fresh-agent comparison is still required; a deterministic IIR round-trip or successful shape alone cannot prove that an LLM plans better across disconnected turns.
