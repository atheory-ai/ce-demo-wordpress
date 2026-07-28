# Initial LMIR/IIR evidence run — 2026-07-22

## Environment

> Historical baseline: the false pass documented here was corrected and
> re-tested in `../2026-07-22-post-fix/summary.md`. This file is retained as
> pre-fix evidence rather than rewritten.

- CE binary: locally built from Context Engine commit `bda20c5` (the binary's embedded version string is `0.4.0-dev`); raw output: `ce-version.txt`.
- Demo fixture: Task 04 bounded TypeScript cache operation. Fixture digests are in `fixture-sha256.txt`.
- Method: three separate processes for every deterministic condition. Raw source, JSON reports, stderr, exit codes, and per-round digests are retained in `run-1/`, `run-2/`, and `run-3/`.
- No WordPress runtime, full-corpus index, database, or source mutation was used.

## Results

| Experiment | Pre-registered expectation | Observed in 3/3 runs | Verdict |
| --- | --- | --- | --- |
| EXP-01 positive round trip | `passed`, stable artifacts | `passed`; generated source and positive report were byte-identical across all runs | Supported for this bounded TypeScript shape |
| EXP-02a missing `cache.invalidate` | hard failure | `failed`, exit 1, `undetected_side_effect:error` | Supported |
| EXP-02b changed `invalid_entity_key` → `entity_not_found` | hard failure | **`passed`, exit 0**; `changed_failure_mode:warning` | **Falsified — false pass** |
| EXP-02c omitted public return annotation | hard failure | `failed`, exit 1, `missing_return_type:error` and named explicit-return rule failure | Supported |
| EXP-03 structural project rule | hard failure | `failed`, exit 1, named `lmir-testing-forbid-empty-key-equality` rule failure | Supported |
| EXP-04 repair missing effect | converges and re-verifies | converged after 2 iterations; re-verification `passed`; repaired source identical across runs | Supported, with scope limit |
| EXP-05 semantic-plan gate | conditional/partial, not accepted | `conditional` plus `Source lift is partial or unsupported; it cannot prove mandatory obligations.` | Supported (correct fail-closed behavior) |
| EXP-06 empty-CWD verification | same as positive, no project residue | `passed`; isolated directory was `empty` after each run; report hash equals positive report hash | Supported for function-level operation |
| EXP-07 test-plan derivation | 3/3 declared expectations | behavior, failure, and effect all reported covered; generated test artifact identical across runs | Supported as test-plan coverage |

The positive fixture retains the default `expected-failures-use-result` warning. That warning is stable and explicit; it is not counted as a failure because the default pack assigns it warning severity.

## Most important finding: failure-mode drift is not a hard gate

The verifier correctly extracted `entity_not_found` from the changed source and correctly identified that the intended `invalid_entity_key` was absent. But it classified `changed_failure_mode` as a **warning**, leaving overall status `passed`. This happened in all three fresh processes.

That makes the current IIR pipeline unsuitable as a complete quality gate for failure-code consistency. It supplies a useful diagnostic, but an agent or CI that accepts only the status could approve a behaviorally significant change. The appropriate follow-up is in CE's comparator/policy design: make an intended-but-unobserved failure mode error-severity by default, or expose a project rule that promotes this exact declared-versus-observed mismatch. A rule over the extracted intent alone cannot express that comparison.

## What the evidence does establish

For covered TypeScript functions, IIR adds value beyond raw text in four specific ways:

1. A compact declaration can be deterministically lowered and re-lifted.
2. Required side effects and public type declarations can fail the build before an edit is accepted.
3. A project can express a structural convention as executable policy instead of relying on prompt-memory or a code-review checklist.
4. The same declaration yields traceable test-plan cases and a bounded repair candidate, without needing an index of WordPress/Gutenberg/WooCommerce.

The evidence does **not** establish that IIR improves an LLM's planning across disconnected turns, or that it semantically verifies the PHP WordPress plugins. Those remain separate claims.

The one model-path availability probe did not run a shape: the demo's `local` provider attempted `http://localhost:11434/api/chat` and received connection refused. Its raw stderr is retained as `model-shape.stderr`. No natural-language-to-IIR or agent-quality conclusion is drawn from that failure.

## Next experiment and release gates

1. Fix or make configurable the failure-mode false pass, then add this exact fixture as a CE regression test and rerun EXP-02.
2. Configure a reachable model provider and execute the fresh, blinded baseline/CE/CE+IIR study defined in `../../00-test-strategy.md`. That is the required evidence for the “better planning across disconnected turns” claim.
3. Have the PHP plugins emit grounded v1 IIR claims, evidence, and coverage before attempting semantic-fidelity experiments over real WordPress PHP.
4. Treat generated tests as plans until they are wired into and pass the relevant upstream test runner.
