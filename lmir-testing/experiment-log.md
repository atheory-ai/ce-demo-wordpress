# Experiment log

This is a contemporaneous evidence ledger. Each entry states the theory before results are interpreted. Raw command outputs live in `results/`.

## EXP-01 — Positive contract round-trip and disconnected-process consistency

- **Theory:** H1. A declared TypeScript function intent produces a stable, verifiable source contract.
- **Method:** run `generate --verify` and `verify --json` three times from separate CE processes against the same checked-in intent.
- **Pass criterion:** all reports are `passed`, no error mismatches, and all generated source/report hashes match.
- **Result:** recorded in `results/2026-07-22-evidence/summary.md` and reconfirmed post-fix in `results/2026-07-22-post-fix/summary.md`.
- **Analysis:** deterministic agreement supports a durable contract for this bounded shape. It does not demonstrate model reasoning or whole-program equivalence.

## EXP-02 — Fidelity defect sensitivity

- **Theory:** H2. The verifier fails rather than silently accepting semantic drift.
- **Method:** independently remove the required cache effect, change the failure code, and omit the public return annotation; verify each variant three times.
- **Pass criterion:** every variant exits non-zero with the predicted mismatch or named policy failure; no false pass.
- **Result:** the baseline false pass and the fixed three-run regression are recorded in `results/2026-07-22-evidence/summary.md` and `results/2026-07-22-post-fix/summary.md`.
- **Analysis:** failure sensitivity only applies to constructs covered by the extractor/comparator. It is not a claim that arbitrary changes are detected.

## EXP-03 — Executable quality policy

- **Theory:** H3. A team rule can turn a code-quality requirement into a deterministic planning/verification gate.
- **Method:** layer the fixture rule that forbids an empty-string equality condition over the default rule pack and verify positive source three times.
- **Pass criterion:** the named rule causes a non-zero, `failed` report in all runs, without corpus indexing.
- **Result:** recorded in `results/2026-07-22-evidence/summary.md` and reconfirmed post-fix in `results/2026-07-22-post-fix/summary.md`.
- **Analysis:** this proves code rules can be executable at function scope. Whether it is a *good* team rule is a policy decision, not a CE fact.

## EXP-04 — Deterministic repair

- **Theory:** H4. A contract violation can be resolved into a reproducible candidate that re-verifies.
- **Method:** repair the missing-effect variant, then verify the emitted source; repeat three times.
- **Pass criterion:** convergence, `passed` re-verification, identical repaired source hashes.
- **Result:** recorded in `results/2026-07-22-evidence/summary.md` and reconfirmed post-fix in `results/2026-07-22-post-fix/summary.md`.
- **Analysis:** current repair regenerates a bounded function from intent. It should be reviewed like any generated edit; it is not a minimal patch engine.

## EXP-05 — Semantic-plan fail-closed gate

- **Theory:** H5. The semantic mutation workflow does not overclaim acceptance when its source evidence is partial.
- **Method:** execute read-only `iir implement --intent` three times.
- **Pass criterion:** status is `conditional` and the partial-lift diagnostic is present on every run.
- **Result:** recorded in `results/2026-07-22-evidence/summary.md` and reconfirmed post-fix in `results/2026-07-22-post-fix/summary.md`.
- **Analysis:** conditional is the correct result. A “passed” implementation claim would be a correctness bug under the current capability matrix.

## EXP-06 — Context isolation

- **Theory:** H6. Function-level verification is useful before whole-repo context acquisition.
- **Method:** run verification from a newly created empty directory, giving only absolute paths to the binary, intent, and source. Repeat three times.
- **Pass criterion:** same positive outcome and the empty working directory is unchanged.
- **Result:** recorded in `results/2026-07-22-evidence/summary.md` and reconfirmed post-fix in `results/2026-07-22-post-fix/summary.md`.
- **Analysis:** this only establishes independence from *project corpus* context. The language plugin still supplies TypeScript semantics.

## EXP-07 — Intent-derived test-plan coverage

- **Theory:** H7. The declared contract can produce a traceable test plan before implementation.
- **Method:** generate tests with `--coverage` three times from the same intent.
- **Pass criterion:** each run accounts for the one behavior, one failure mode, and one side effect (3/3), and emitted artifacts match.
- **Result:** recorded in `results/2026-07-22-evidence/summary.md` and reconfirmed post-fix in `results/2026-07-22-post-fix/summary.md`.
- **Analysis:** coverage means every declared expectation receives a test-plan entry. It does not mean a generated test executed or demonstrated runtime coverage.

## EXP-08 — Model-backed shaping and verification boundary

- **Theory:** H8/H9. A configured model can produce a valid IIR contract that retains the stated requirements, while CE does not overstate source verification when its generator cannot lower free-text behavior.
- **Method:** configured the demo with `openai`, `gpt-5.6-luna`, and `reasoning_effort: medium` (the key stays in `OPENAI_API_KEY`). Ran the same `normalizeKey` request in three independent `ce iir shape` processes, then three independent `shape --generate --verify` processes. The earlier local-provider availability probe remains retained in `results/2026-07-22-evidence/model-shape.stderr` as a historical failed setup attempt.
- **Pass criterion:** every shape is valid and retains the named function, `key: string`, `ValidationResult<string>`, `EMPTY_KEY`, no side effects, and trim requirement. Generated source is called verified only if its round-trip report is `passed`.
- **Result:** recorded in `results/2026-07-22-luna-medium/summary.md`. All three shapes were valid and retained the core contract. All three generated-source reports were `inconclusive`, despite exit code 0.
- **Analysis:** this establishes a working, bounded NL → IIR model path and reveals a generator/lifter gap: prose behavior is emitted as `if (false)` placeholders, so the deterministic verifier correctly cannot prove the intended behavior. It is not evidence of implementation correctness, agent planning quality, or WordPress/PHP semantic verification.
