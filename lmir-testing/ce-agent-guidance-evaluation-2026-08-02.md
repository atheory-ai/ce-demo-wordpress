# CE agent-guidance evaluation — 2026-08-02

## Question

Can CE remain a bring-your-own-intelligence evidence system while teaching a
coding agent to investigate iteratively, traverse exact graph anchors, verify
source, and check completeness—without embedding an LLM or converting a whole
natural-language question into a hidden query plan?

## Theory

The framework graph already contains the decisive WordPress/WooCommerce
relationship for Task 07, but the prior Luna evaluation did not discover it.
The theory was that a shared field manual, native MCP schemas, and deterministic
orientation/next-step tools would make agents use the existing graph more
strategically and consistently.

This change deliberately keeps reasoning in the host agent. CE adds no model
call and infers no facts from the benchmark prompt.

## Implementation under test

The local CE build adds:

- one canonical exploration catalog shared by MCP and CLI;
- `ce guide [workflow]` and `ce explain <tool>`;
- MCP manuals, workflow resources, and prompts;
- MCP initialize instructions that describe CE as an evidence/navigation
  system rather than an answer engine;
- `ce_orient`, which reports index/projection readiness, configured plugin
  selection, lazy runtime residency, and the exploration protocol;
- `ce_suggest_next`, which inspects incident graph edges around caller-supplied
  exact node IDs and excludes caller-supplied seen IDs;
- strict rejection of unknown top-level tool arguments;
- native per-tool schemas in the evaluation harness instead of the former
  generic `ce_tool` wrapper;
- focused empty-result recovery and explicit exact-ID chaining advice.

`ce_suggest_next` is read-only and deterministic. It does not interpret the
task, save investigation state, or call an LLM.

## Correctness verification

The CE unit, integration, golden-IIR, and acceptance packages passed under
`CGO_ENABLED=0`. The two HTTP provider packages that require ephemeral
localhost listeners were rerun outside the restricted sandbox and passed.
Formatting, `go vet`, and golangci-lint reported no issues. The changed
guidance, MCP, and runner packages also passed under the race detector.

A real MCP smoke test against the prepared WordPress graph confirmed:

- tools, resources, prompts, and server instructions are advertised;
- the explicit six-plugin project selection is visible even when no lazy WASM
  runtime is resident in the read process;
- all three projections report completed;
- an exact `wc_user_logged_in` anchor exposes `framework_invokes`,
  `invokes_via_hook`, `subscribes_with`, `calls`, and `defines` neighbors;
- an unknown tool argument fails rather than being silently ignored.

## Experimental method

The corpus, Task 07 prompt, `gpt-5.6-luna` model, medium reasoning effort,
12-retrieval budget, source-read rule, and prepared graph were held constant.
Only CE and the CE-side harness interface changed. Every run preserves its full
tool trace, so final prose receives no credit unless the trace actually
contains supporting evidence.

The five evidence groups are the same as the prior evaluation:

1. Store API handler and Cart-Token session selection;
2. token/session identity behavior;
3. the saved-cart merge condition and login marker;
4. request/JWT authentication does not inherently dispatch `wp_login`;
5. a narrowly scoped Store API fix and appropriate regression-test surface.

## Round 1 — native tools plus field manual

Two independent runs used the first complete guidance build.

| Run | CE calls | Source reads | Prompt tokens | Evidence score |
| --- | ---: | ---: | ---: | ---: |
| 1 | 10 | 2 attempted | 97,488 | 2/5 |
| 2 | 10 | 2 attempted | 102,872 | 2.5/5 |

Both runs used native tool names and valid top-level schemas. Both found the
Store API `SessionHandler`/`CartTokenUtils` area and produced a plausible
session-precedence explanation. Neither traversed the known
`wp_login -> wc_user_logged_in -> _woocommerce_load_saved_cart_after_login`
path or inspected the merge implementation. One run exhausted its budget after
requesting an over-wide source range; both final responses rendered additional
desired tool calls as prose after the synthesis-only boundary.

The traces exposed two concrete affordance gaps:

- filtered empty semantic results did not explain that the model had guessed a
  filter and should retry without it;
- exact structural results did not make the next exact-ID traversal prominent
  enough, so Luna continued issuing broad searches.

## Round 2 — recovery and chaining affordances

CE was tightened without changing the graph or benchmark:

- structural search now recommends an exact next traversal beside the result;
- filtered empty results name the applied filters and recommend a safe retry;
- search schemas and descriptions discourage large result sets;
- the field manual tells the agent to maintain a causal-facet checklist and
  stop broadening once a relevant exact ID exists.

| Run | CE calls | Source reads | Prompt tokens | Evidence score |
| --- | ---: | ---: | ---: | ---: |
| 1 | 9 | 3 attempted | 114,976 | 3/5 |
| 2 | 10 | 2 attempted | 96,618 | 2.5/5 |

The behavioral improvement is real but limited:

- both runs used result limits of 10 instead of repeatedly requesting 20–30;
- both formed an explicit causal-facet checklist;
- both chained exact anchors into composed/file-context tools;
- both consistently found and read the token-session precedence code;
- both named a safe Store API-specific change boundary and relevant tests.

However, neither run called `ce_suggest_next`. More importantly, neither spent
its remaining retrieval budget on the disconnected login/merge facet. The
answers again described `wp_login` and cart-session merge behavior without
retrieving the decisive registration, callback, marker, merge condition, or
WordPress login-dispatch source. Those claims therefore do not receive full
credit.

## Comparison with the frozen predecessor

| Condition | Runs | Scores | Mean |
| --- | ---: | --- | ---: |
| Prior source-only | 2 | 5/5, 3.5/5 | 4.25 |
| Prior CE wrapper | 2 | 3/5, 2/5 | 2.5 |
| Native guidance round 1 | 2 | 2/5, 2.5/5 | 2.25 |
| Native guidance round 2 | 2 | 3/5, 2.5/5 | 2.75 |

Round 2 is more disciplined and slightly more consistent than the prior CE
wrapper result, but it does not close the correctness/completeness gap against
source-only investigation. Prompt-token totals also do not demonstrate a cost
win in this sample.

## Analysis

The implementation closes the product-interface gaps it targeted:

- a real MCP client can discover CE's manual, prompts, native schemas, and live
  project capability surface;
- the CLI exposes the same workflows;
- tool misuse fails clearly;
- a host agent can carry exact/seen IDs through deterministic exploration;
- CE remains model-agnostic and read-only during investigation.

The experiment rejects the stronger theory that documentation and better tool
affordances alone will reliably bridge disconnected problem concepts within a
tight 12-call budget. Luna improved its search discipline, but did not revisit
the login/merge facet before synthesis. This is not evidence that CE has no
value: the decisive framework edge remains present and exact-anchor traversal
returns it immediately. It is evidence that availability plus instructions is
not yet reliable discovery.

## Verdict

**The agent-guidance architecture is implemented and production-shaped.** It
is useful independently of this benchmark and preserves CE's bring-your-own-
intelligence boundary.

**The Task 07 effectiveness gate remains yellow.** The second round raised the
mean evidence score only from 2.5 to 2.75 and did not produce a complete run.
We should not market this change as closing CE's correctness/completeness gap.

The next experiment should distinguish two possibilities without hiding an LLM
inside CE:

1. allow a realistic continuation budget and require the host to complete its
   own declared facet checklist before synthesis; and
2. separately improve structural concept bridges/ranking so Store API session
   identity can navigate to the existing login-marker and saved-cart merge
   facts.

Those should be measured as separate changes. Otherwise a longer agent run can
mask a graph-navigation defect, or a better graph can be blamed for a harness
that forced synthesis before the agent completed its investigation.
