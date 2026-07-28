# Failure-contract regression rerun — 2026-07-22

## Purpose and environment

This is the post-fix counterpart to `../2026-07-22-evidence/summary.md`. It uses a CE binary built from the working Context Engine tree after the failure-contract fix. The embedded binary version remains `0.4.0-dev`; the source revision and raw fixture hashes are recorded with the CE change and in this result directory.

The harness now asserts every expected exit code and report status. A future false pass makes `lmir-testing/run-experiments.sh` exit non-zero rather than merely recording an artifact.

## Three-process result comparison

| Condition | Baseline (3/3) | Post-fix (3/3) | Result |
| --- | --- | --- | --- |
| Positive verification | `passed`, exit 0 | `passed`, exit 0 | Preserved |
| Missing required effect | `failed`, exit 1 | `failed`, exit 1 | Preserved |
| Changed failure code | **`passed`, exit 0** | **`failed`, exit 1** | Fixed |
| Missing explicit return | `failed`, exit 1 | `failed`, exit 1 | Preserved |
| Structural policy | `failed`, exit 1 | `failed`, exit 1 | Preserved |
| Deterministic repair | `passed` after repair | `passed` after repair | Preserved |
| Semantic mutation workflow | `conditional` | `conditional` | Preserved fail-closed coverage boundary |
| Empty-CWD verification | `passed`; CWD empty | `passed`; CWD empty | Preserved |

Each post-fix wrong-failure report now contains one error-severity `changed_failure_mode` finding. It identifies both sides of the contradiction: the declared `invalid_entity_key` is absent and the source exposes undeclared `entity_not_found`.

Generated source, repaired source, and intent-derived test-plan artifacts have identical SHA-256 digests across all three post-fix runs. The fix changes only the fidelity verdict for contradictory observed failure evidence.

## Semantics retained deliberately

When the current extractor sees **no** comparable failure evidence—for example, a `Result`-returning branch it does not yet model—the result is `inconclusive`, not `passed` and not a false hard failure. A contradictory observed thrown failure is different: it is direct evidence that the declared contract does not match and therefore fails.

## Remaining gates

- Model-backed/fresh-agent effectiveness remains untested because the demo's configured local model endpoint is unavailable.
- PHP WordPress and WooCommerce plugins remain convention/navigation evidence; they do not yet emit grounded v1 IIR claims and coverage.
- Generated tests remain test plans until executed in a relevant upstream test runner.
