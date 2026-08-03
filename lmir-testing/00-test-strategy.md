# Test strategy: does LMIR/IIR improve code planning quality?

## Decision question

We want evidence for two distinct propositions:

1. **Semantic pipeline value:** does a compact, declared intent make a bounded change more checkable and policy-governed than raw source or prose alone?
2. **Agent planning value:** when a model is asked to plan or implement a WordPress-related change with little repository context, does IIR plus relevant CE evidence produce a more correct, consistent, and rule-compliant result than the same model without it?

The first is executable locally now. The second requires fresh, blinded agent trials; it must not be inferred from a deterministic generator.

## Theories and falsifiers

| ID | Theory | Intervention and measured outcome | Falsified when |
| --- | --- | --- | --- |
| H1 | A declared function intent is a stable semantic contract. | Generate, lift, and verify the Task 04 intent in 3 fresh processes. Compare report status and artifact hashes. | Any positive run fails, differs materially, or produces an error mismatch. |
| H2 | Fidelity verification catches meaningful implementation drift. | Remove the required cache effect, alter the declared failure code, and remove the public return annotation; verify each 3 times. | A deliberately broken source passes, or a correct source fails. |
| H3 | Project policy can quality-gate source through normalized intent rather than prompt wording. | Apply a rule forbidding the `=== ""` condition shape to otherwise passing source, 3 times. | The policy does not fail the run, is non-deterministic, or depends on corpus indexing. |
| H4 | A bounded defect can be repaired with traceable, repeatable output. | Repair the missing-effect source and re-verify the emitted result, 3 times. | Repair fails to converge, retains the mismatch, or varies materially. |
| H5 | The semantic-plan workflow fails closed when evidence is insufficient. | Run read-only `iir implement --intent` 3 times. Inspect status and diagnostic. | It reports a verified/pass result despite the documented partial source-lift coverage. |
| H6 | Function-level IIR needs only its intent, source, language plugin, and rules—not an indexed whole codebase. | Verify from a newly created empty working directory using absolute fixture paths, 3 times. | It needs the WordPress checkout/index, changes the clean directory, or changes outcome. |
| H7 | An intent can produce a traceable test plan before implementation. | Generate tests with declared-coverage output 3 times. | Any declared behavior, failure, or effect is unaccounted for, or output varies. |
| H8 | A configured model can retain the key requirements of a natural-language function request in a valid IIR contract. | Shape one fixed request in 3 independent processes; audit function name, input, return type, failure tag, side-effect declaration, and normalization constraint. | Any response is invalid, omits a required contract field, or invents a conflicting side effect/failure. |
| H9 | A model-shaped intent must not be described as source-verified until the generated source has a `passed` report. | Run `shape --generate --verify` 3 times and record both exit code and report status. | Tooling or documentation treats `inconclusive` as a verified success. |
| H10 | CE-guided iterative retrieval improves a smaller model's final source-backed investigation over ordinary source exploration. | Use the same `gpt-5.6-luna` / medium model, task, 16-turn budget, and final-answer rubric in paired runs. The only variable is ordinary `rg`/read tools versus CE graph tools plus CE-cited narrow reads. | CE fails to improve relationship coverage, safe plan/test targeting, or unsupported-claim avoidance across the paired tasks; a latency-only gain does not count. |

All results must be recorded at least three times. This detects accidental stateful behavior, but it is *not* a statistical sample of arbitrary programs.

## Fixtures and oracle

The fixture is a small client-side cache invalidation function related to `demo/tasks/04-rest-api-editor-data-flow.md`. `fixtures/intent.yaml` is copied from the checked-in demo intent so the experiment has a durable input. The positive source is the deterministic CE-generated artifact.

The expected oracle is specified before a run:

| Condition | Expected CLI result | Primary evidence |
| --- | --- | --- |
| Positive round trip | `passed`, exit 0 | no error mismatch; required effect and failure are observed |
| Required effect removed | `failed`, non-zero | missing declared effect |
| Failure code changed | `failed`, non-zero | missing intended / unexpected observed failure |
| Return type removed | `failed`, non-zero | public explicit-return policy failure |
| Structural policy added | `failed`, non-zero | named project rule reports the forbidden normalized condition |
| Repair missing effect | convergence, exit 0; repaired output verifies | regenerated contract-conforming source |
| Read-only semantic plan | `conditional`, exit 0 | partial-coverage diagnostic; never “verified” |
| Empty-CWD verification | same as positive | no corpus index or project-wide context required |
| Generated tests | 3/3 declared expectations covered | test identifiers are tied to behavior, failure, and effect nodes |
| Model shape | valid IIR retaining all pre-specified core requirements | audit of all three independently shaped IIR objects |
| Model shape → generated source | `passed` only if deterministic source lift proves it | report status, not process exit code alone |

The warning in the default pack that failures should use a `Result` type is tracked but does not turn the bounded positive fixture into a failure. This is an example of explicit, reviewable policy rather than an implicit claim that the sample is ideal production style.

## Measurements

For each run retain CE version/build identity and fixture hashes; exit code, report status, mismatches, named rules, and diagnostics; generated/repaired source hash for repeatability; elapsed time as a diagnostic only; and a working-directory before/after assertion for H6. Correctness is primary. A faster result that misses the changed failure mode is worse than a slower, fail-closed result.

## Fresh-agent study: evidence required for the product claim

The deterministic work above tests the mechanism. To test whether it helps people or agents *plan better*, run this pre-registered paired study after a model provider is configured:

1. Select 12 WordPress/Gutenberg/WooCommerce tasks before starting (four each: localized function change, cross-package data-flow diagnosis, and convention-sensitive mutation). Hold out Task 04 and all experiment fixtures from scoring calibration.
2. For each task, start a fresh agent with no copied transcript. Randomize and counterbalance condition order across agents:
   - **A — baseline:** task prompt and normal narrow source access;
   - **B — CE evidence:** same prompt plus cited CE graph/source evidence;
   - **C — CE + IIR:** B plus an applicable declared intent, project rules, and `generate`/`verify`/`gen-tests` results. Use PHP plugin facts only as navigation evidence, never as PHP IIR proof.
3. Do not expose condition labels to two independent reviewers. Give reviewers the source commit and an answer/plan, not tool transcript or runtime.
4. Score each plan on a 0–2 rubric: factual correctness, appropriate source coverage/citations, dependency and failure handling, rule compliance, testability, and unsupported-claim avoidance (maximum 12). Separately score an implementation with source tests and the applicable semantic report.
5. Record CE tool calls, narrow reads, wall time, IIR status, reviewer scores, disagreements, and concrete misses. Compare paired score deltas and inspect disagreements before any aggregate claim.

Success means C improves correctness and policy/testability without increasing unsupported claims. A result is *not* success merely because a candidate is generated or because a tool was used. Report ties, regressions, and tasks where the representation was too narrow.

## Small-model iterative context study (H10)

This is a more focused precursor to the full blinded study. It tests the product
claim that CE makes a model's *eventual* investigation better, rather than
claiming a one-shot answer is enough. The repeatable driver is
`run-agent-comparison.mjs`; it uses the configured OpenAI model directly and
stores every model/tool turn for audit.

Use three pre-selected cross-package tasks, with three independent paired runs
of each:

1. Task 04 — REST API to editor stale-data path;
2. Task 07 — Store API headless cart-merge regression;
3. Task 01 — block registration and server rendering.

For every pair, hold fixed the source revision, task text, model
`gpt-5.6-luna`, medium reasoning effort, 12 retrieval turns followed by one
tool-free final-synthesis turn, and final-answer instructions. The baseline may use normal targeted repository search and
narrow source reads. The CE condition receives only deterministic CE graph
tools and narrow reads of paths already cited by a CE response; the harness
enforces this restriction. Neither condition receives an answer key.

An evaluator who did not drive either run scores the final answer against the
checked-out source, without seeing the condition label, 0–2 on each dimension:

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Causal/relationship accuracy | wrong or disconnected | partly correct | correct cross-package chain with causal ordering |
| Critical source coverage | misses most anchors | finds some anchors | finds all task-critical source/test/extension anchors |
| Safe change plan | unsafe or generic | plausible but incomplete | scoped, compatible, and separates fact from runtime hypothesis |
| Regression-test targeting | missing or irrelevant | partial | names the appropriate focused test surfaces and assertions |
| Evidence calibration | unsupported claims | mixed evidence/inference | every material claim source-grounded or explicitly uncertain |
| Retrieval efficiency (diagnostic) | materially impractical | usable | targeted with little irrelevant context |

The primary paired score is the first five dimensions (maximum 10). Tool
counts, token counts, and elapsed time are retained as diagnostics. A positive
result requires a consistent gain in the primary score or a concrete avoided
critical miss across repetitions; an average speedup alone is insufficient.

## Known limitations and next gates

- `ce iir shape` is the model-backed hop. The first configured OpenAI run establishes reachability and field retention for one bounded request; it does not substitute for a semantic judge or the blinded fresh-agent study.
- The current TypeScript generator cannot lower arbitrary natural-language `behavior` sentences into executable conditions. Its placeholder output is expected to verify as `inconclusive`; it must not be presented as generated-and-verified implementation.
- The shipped default TypeScript indexed lift is legacy/partial coverage. Mandatory semantic-plan obligations must remain conditional/inconclusive.
- Generated test files are traceable test *plans*, not evidence that an upstream WordPress/Gutenberg suite executed.
- The PHP demo plugins need grounded v1 IIR claims, source evidence, and coverage before adding PHP semantic-fidelity tests to this matrix.
