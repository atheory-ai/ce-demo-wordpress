# CE iterative context evaluation — 2026-08-02

## Question

Does CE make an iterative codebase investigation more correct, complete, and
consistent than source-only discovery? The test is deliberately not a
one-shot-answer or first-result contest. Each agent may refine its hypothesis,
follow several connections, and inspect narrowly selected source. The final
answer is scored on its causal coverage, factual support, uncertainty, and
repeatability.

## Theory

Filesystem search can find exact strings quickly, but an agent must invent its
own traversal and may omit a disconnected framework boundary. CE should provide
a deterministic navigation matrix of structural and semantic facts, allowing
the agent to refine broad questions into exact anchors and then inspect only
the relevant source. The expected advantage is higher final-answer confidence
and lower run-to-run variance, especially with a smaller model; fewer tool calls
or a better first search are not success criteria.

## Conditions

- Corpus: the WordPress, Gutenberg, and WooCommerce demo checkout.
- CE: local branch build after semantic-search ranking and anchor-qualified
  related-context improvements.
- Model: clean-context `gpt-5.6-terra`, medium reasoning, no network.
- Repetitions: two independent runs per condition and task.
- Budget: up to 12 retrieval turns; narrow reads of retrieved source were
  allowed.
- Baseline: ordinary repository search and source reads without CE.
- CE condition: CE MCP investigation, semantic, structural, graph, and source
  context tools. Iterative refinement was expected.
- External API harness: not run. Sending CE-selected source excerpts to the
  configured OpenAI API was not authorized for this evaluation, so the desired
  `gpt-5.6-luna` gate remains pending explicit approval.

The raw harness captures available in
`results/2026-08-02-semantic-context/` are retained alongside this report.

## Experiment A — REST entity records to the Gutenberg editor

### Prompt objective

Explain the path from a WordPress REST entity endpoint through Gutenberg
`core-data` retrieval and cache state to an editor consumer. Identify the
important controller/configuration, resolver, action/reducer or cache, and
consumer anchors. Separate direct source evidence from inference.

### Required evidence

1. the dynamic REST post-type/entity endpoint or controller;
2. `getEntityRecord`/`getEntityRecords` resolver behavior;
3. `receiveEntityRecords` and queried-data/cache state;
4. resolver-cache or invalidation behavior;
5. an editor `useSelect` consumer.

### Results

| Condition | Run | Final causal coverage | Consistency notes |
| --- | ---: | --- | --- |
| Baseline | 1 | Complete dynamic path from the REST post-type controller/configuration through `loadPostTypeEntities`, `getEntityRecords`, `receiveEntityRecords`, the queried-data reducer and resolver-cache middleware to an editor `useSelect` consumer | Source-backed; used the full 12-call budget |
| Baseline | 2 | Complete and substantially equivalent path, including dynamic post-type endpoint configuration, resolver/invalidation, and editor consumer | High agreement with run 1; 10 calls |
| CE | 1 | Found REST update/controller, resolver, action/save, editor selector and `useSelect` anchors, but did not close the entity-configuration and queried-data-reducer portions as completely | Relevant exact anchors improved; broad related-test and semantic probes consumed budget without adding evidence |
| CE | 2 | Recovered a good REST/resolver/action/reducer/editor chain | Better than CE run 1, but test/reference/semantic retrieval still added little and variance remained material |

### Analysis

CE's exact-anchor retrieval is now useful and repeatable, but this experiment
does not establish an advantage over source-only exploration. The baseline was
equal or slightly more complete and more consistent. Anchor ranking is no
longer the main defect; CE still needs richer connected evidence between
framework semantics, data-state transitions, and concrete consumers. Related
context must also return no evidence rather than spend the agent's budget on a
generic pattern match. That precision defect was reproduced and fixed after
these runs.

## Experiment B — Store API Cart-Token and login cart merge

### Prompt objective

Explain how a WooCommerce Store API `Cart-Token` selects and loads session
state, how that interacts with a user login or saved-cart merge, and where a
safe fix should be placed. Distinguish the Store API session handler from the
legacy/core session query-parameter path.

### Required evidence

1. Cart-Token detection and session-handler selection;
2. token payload/user identity behavior;
3. the saved-cart merge condition and login marker;
4. whether JWT/current-user filtering triggers WordPress login side effects;
5. a narrowly scoped change and test surface.

### Results

| Condition | Run | Final causal coverage | Consistency notes |
| --- | ---: | --- | --- |
| Baseline | 1 | Complete current-source trace: Store API authentication and `AbstractCartRoute` select `StoreApi\SessionHandler`; token payload guest identity remains authoritative; `WC_Cart_Session::get_cart_from_session()` gates saved-cart merge; `wc_user_logged_in()` sets the login marker | Correctly distinguished JWT `determine_current_user` from the `wp_login` side effect and proposed a scoped merge fix |
| Baseline | 2 | Substantially equivalent complete trace | High agreement with run 1 |
| CE | 1 | Correctly found Store API handler selection, authentication precedence and route behavior, but did not find the exact merge hook/marker | Appropriately reported uncertainty instead of inventing the missing edge |
| CE | 2 | Found the core `WC_Session_Handler::init_session_from_request()` `?session=` path and applied it to the Cart-Token header flow | Material accuracy failure: current Cart-Token handling explicitly selects the separate Store API session handler |

### Analysis

This experiment fails the consistency gate. The source-only baseline found the
current handler split and the disconnected `wp_login` marker in both runs. One
CE run was incomplete but honest; the other followed a plausible, indexed
session symbol into the wrong runtime path and stated the result too
confidently.

Deterministic review exposed the missing connection: the convention plugin had
recorded `add_action('wp_login', 'wc_user_logged_in')`, but its
`subscribes_with` relationship was unresolved even though the PHP plugin had a
unique same-file `wc_user_logged_in` symbol. CE therefore could not navigate
from the hook semantic occurrence to the concrete callback and onward to the
saved-cart marker.

The host semantic projector now resolves supported quoted literal callback
expressions to structural symbols conservatively: a unique same-file symbol is
preferred, otherwise global uniqueness is required, and multiple candidates
remain ambiguous. It also maintains indexed dependency keys so adding,
removing, moving, or renaming the callback reprojects an unchanged registration
file during watcher refresh. An isolated full-corpus validation materialized
the expected `wp_login` → `wc_user_logged_in` edge.

## Verdict

**Retrieval precision: improved.** Exact identifiers reliably outrank generic
terms, semantic coverage no longer displaces relevant anchors via source-path
matches, and related-context tools now decline unsupported global guesses.

**Index/graph correctness for literal framework callbacks: corrected and
validated.** The missing WordPress hook-to-PHP-symbol connection is now
materialized with replacement-safe incremental invalidation.

**CE advantage over source-only investigation: not yet demonstrated.** On
these four paired repetitions the baseline was at least as complete and was
more consistent. CE provided useful anchors but did not yet convert them into a
consistently superior final causal model. The second Cart-Token CE run is a
material counterexample to the product claim.

## Next gate

1. Rebuild/reproject the accepted demo graph with the callback-resolution
   change and repeat both experiments twice.
2. Add an explicit rubric scorer for required anchors, unsupported claims,
   uncertainty calibration, and run-to-run agreement.
3. Add a task whose critical evidence crosses a semantic relationship that
   source-string search cannot discover directly; verify CE actually traverses
   that edge.
4. Run the same matrix with the intended smaller external model only after
   source-excerpt transmission is explicitly authorized.
5. Treat a positive CE claim as passing only when completeness is at least the
   baseline, unsupported claims are lower, and both CE repetitions agree on the
   relevant runtime path.
