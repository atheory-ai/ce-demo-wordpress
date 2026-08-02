# CE framework-intelligence retest — 2026-08-02

## Question

Did the framework-execution graph close the Task 07 correctness and consistency
regression, and does the rebuilt full WordPress/WooCommerce index expose the
runtime relationships an agent needs to understand a headless cart merge?

This is a final-answer evaluation, not a one-shot retrieval contest. Each
investigation could iterate through up to 12 retrievals and inspect source
before reaching a conclusion.

## Theory

The previous graph recorded `add_action( 'wp_login', 'wc_user_logged_in' )` as
an isolated semantic occurrence. It did not connect the registration to the PHP
callback or the `wp_login` dispatch inside `wp_signon()`. That missing framework
boundary allowed one CE run to follow a plausible but wrong session path.

The new projection should materialize both:

```text
semantic:wordpress.hook:wp_login
  --framework_invokes--> wc_user_logged_in

wp_signon
  --invokes_via_hook--> wc_user_logged_in
```

If the theory is correct, repeated CE-assisted investigations should find the
login side effect, distinguish request authentication from login, and avoid the
prior legacy-session-handler error.

## Build and corpus

- CE build: local `agent/semantic-context-modules` build at commit `fca3dfc`.
- Demo plugins: local build at commit `7b0ebda`, plus the matcher correction
  described below.
- Corpus: WordPress, Gutenberg, WooCommerce, and demo plugins.
- Data directory: an isolated fresh directory on `/Volumes/Lukes`; no prior
  generation was reused.
- Evaluation task: `demo/tasks/07-store-api-headless-cart-merge.md`.

## Full-index acceptance run

The first attempted run was rejected rather than scored. The WooCommerce
decorator accepted PHP under `/build/` even though its required PHP provider
excluded those files, producing 114 extraction errors. The WooCommerce matcher
was changed to use the same PHP/PHTML eligibility boundary as its provider and
a regression test was added.

The corrected clean run completed with:

| Metric | Result |
| --- | ---: |
| Files walked | 34,127 |
| Files indexed | 21,554 |
| Files unmatched/skipped | 12,573 |
| Files errored | **0** |
| Profile elapsed | 390.4 s (6m30s) |
| CE total-duration statistic | 400.8 s (6m41s) |
| Nodes written | 117,184 |
| Edges written | 97,132 |
| Writer flushes | 91 |
| Writer operations flushed | 319,332 |
| Generation DB | 816 MB |
| Total CE data directory | 869 MB |
| Go peak allocated heap | 1.75 GB |
| Go peak system reservation | 2.02 GB |
| Go allocated heap after final GC | 971 MB |

Database integrity checks found zero edges with missing endpoints.

## Framework projection acceptance

The accepted graph contains:

| Relationship | Count |
| --- | ---: |
| `declared_in` | 36,752 |
| `framework_invokes` | 2,950 |
| `invokes_via_hook` | 8,848 |

For the original regression, the persisted graph contains all of:

- structural symbol `wc_user_logged_in`;
- canonical semantic hook `semantic:wordpress.hook:wp_login`;
- the `add_action` registration with priority 10 and two accepted arguments;
- `wp_login --framework_invokes--> wc_user_logged_in`;
- `wp_signon --invokes_via_hook--> wc_user_logged_in`;
- exact source evidence for the registration and callback.

`ce_investigate("wc_user_logged_in")` surfaces this relationship explicitly in
its call graph as framework-mediated, rather than misrepresenting it as a direct
PHP call. A canonical-ID `ce_semantic_path` returns the same path.

## Repeated investigation results

The rubric had five required findings:

1. Store API handler and Cart-Token session selection;
2. token/session identity behavior;
3. saved-cart merge condition and login marker;
4. JWT/current-user authentication does not inherently trigger `wp_login`;
5. a narrowly scoped Store API fix and appropriate regression-test surface.

| Condition | Run | Required findings | Materially wrong claims | Result |
| --- | ---: | ---: | ---: | --- |
| Source only | repeated baseline | 5/5 | 0 | Complete and source-backed |
| CE assisted | 1 | 5/5 | 0 | Complete; found the mediated login path in 9 CE retrievals |
| CE assisted | 2 | 5/5 | 0 | Complete; independently found the mediated login path |

Both CE runs reached the same causal explanation:

1. a valid guest Cart-Token selects/restores guest-derived session state;
2. JWT/request authentication may establish a WordPress current user without a
   WordPress login transaction;
3. normal `wp_signon()` dispatches `wp_login`;
4. WooCommerce's `wc_user_logged_in()` callback writes
   `_woocommerce_load_saved_cart_after_login`;
5. `WC_Cart_Session::get_cart_from_session()` consumes that marker and merges
   the persistent saved cart with the current session cart;
6. without the marker, the non-empty token-derived cart prevents that merge.

Neither CE run repeated the earlier error of treating the legacy/core request
session path as the current Store API Cart-Token implementation.

## What improved

- **Correctness:** the hidden WordPress-to-WooCommerce callback is now a
  navigable fact, backed by exact source occurrences.
- **Completeness:** both CE runs covered all five required causal and remediation
  points; the prior CE runs covered the marker inconsistently.
- **Consistency:** two of two CE runs agreed on the decisive runtime path and
  safe change boundary.
- **Uncertainty calibration:** the answers still separated the absent reporter
  JWT plugin and runtime overwrite timing from source-confirmed behavior.

## Remaining yellow findings

- Free-text `ce_semantic_path` did not resolve `wp_signon` and
  `wc_user_logged_in`; the same query works after obtaining exact canonical IDs.
- `ce_references` can return no context for a callback even though callgraph and
  semantic context contain the framework-mediated relationship.
- Related-test discovery returned no tests for relevant cart/session symbols,
  despite appropriate WooCommerce tests existing.
- Long natural-language semantic-search queries remain much less reliable than
  exact symbol or hook searches.
- Some composed investigation packets are noisy or shallow, requiring the
  agent to refine with exact anchors.
- Index memory remains material: allocated heap peaked at 1.75 GB and retained
  971 MB after final GC. Persisted storage is below the former multi-gigabyte
  result but is still 869 MB.

## Verdict

**The framework-execution regression is closed.** The graph is correct for the
tested hook, the decisive edge is exposed through normal CE investigation and
callgraph tools, and two repeated CE-assisted investigations were complete,
correct, and mutually consistent.

**Task 07 now reaches parity with the strong source-only baseline.** That is a
material improvement from the previous CE inconsistency, but it is not by
itself evidence that CE is generally superior to source search. The strongest
next effectiveness test is a task whose decisive framework relationship cannot
be found by searching for a shared literal name, followed by the same repeated
scoring.

The external `gpt-5.6-luna` harness was not run because it would transmit local
source-derived context to the OpenAI API. That run requires explicit approval
for that payload and destination.
