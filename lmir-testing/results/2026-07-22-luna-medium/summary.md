# Model-backed LMIR/IIR shaping run — 2026-07-22

## Pre-registered question

Can the configured model-backed `ce iir shape` path retain the important parts
of a small, explicit natural-language contract, and does the downstream CLI
avoid claiming the resulting source is verified when the generator cannot
lower its free-text behavior?

## Environment and method

- CE was built locally from the accompanying Context Engine working tree. Its
  OpenAI provider was configured and unit-tested to send the standard model
  `gpt-5.6-luna` with `reasoning_effort: medium`.
- The demo's `ce.yaml` selects that provider/model/effort. No key is committed:
  the six bounded calls received `OPENAI_API_KEY` only from CE's local `.env`
  in the invoking process.
- Fixed request: a public TypeScript `normalizeKey(key: string)` that trims
  whitespace, returns `ValidationResult<string>`, reports `EMPTY_KEY` for an
  empty normalized key, returns the normalized key otherwise, and has no side
  effects.
- Three independent processes ran `ce iir shape`; three fresh processes ran
  `ce iir shape --generate --verify`. Raw output, stderr, exit codes, and SHA-256
  digests are retained in `run-1/` through `run-3/`.
- This did not index WordPress, write project source, or claim PHP semantic
  verification.

## Results

| Check | Observed in 3/3 runs | Result |
| --- | --- | --- |
| Valid `FunctionIntent` | CLI exited 0 and emitted parseable IIR | Supported |
| Function/signature | `normalizeKey`, public, `key: string`, `ValidationResult<string>` | Supported |
| Failure and effects | `EMPTY_KEY`; `sideEffects: []` | Supported |
| Normalization requirement | each run retained leading/trailing-whitespace trim in a constraint or behavior | Supported |
| Behavior wording | all runs included empty/non-empty cases; run 2 made trimming a separate behavior while runs 1 and 3 combined it with the empty case | Variation recorded; no exact-stability claim |
| Shape → generated source → lift | exit 0 but round-trip status `inconclusive` | Not source-verified |

The first three IIR artifacts have different hashes, so natural-language shape
is not byte-stable. That is expected for a model output and is why this study
scores retained contract fields rather than byte identity. The critical fields
above agree across all runs; the free-text behavior decomposition does not.

## Analysis

This is evidence that the configured model route works and can create a small,
reviewable semantic planning artifact without loading the WordPress corpus. It
is not evidence that CE can turn arbitrary prose into a verified implementation.

The generated programs contain `if (false)` placeholders for the natural-
language conditions and a generic successful return. The source lift therefore
reports `inconclusive` in all three cases. That is the correct fail-closed
interpretation: process exit code zero means the command completed without a
hard `failed` report, not that the program satisfies the model-shaped contract.

The next improvement is a versioned, structured behavior/condition vocabulary
that the shaper can emit and the generator can lower deterministically. Until
then, model-shaped IIR should be treated as a planning and review artifact; a
hand-authored or normalized executable intent is needed before `generate` plus
`verify` can function as a quality gate.
