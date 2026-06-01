# Benchmark Comparison: Store API Headless Cart Merge Regression

## Summary

This report updates the earlier Store API headless cart merge benchmark after
the Context Engine fixes in CE commit `38cd896`.

Task: `demo/tasks/07-store-api-headless-cart-merge.md`

Primary scoring is correctness and depth. Time, request count, and token volume
are recorded as telemetry, but they are not weighted unless they make the task
impractical.

Current result: CE is functioning much better than the stale May 29 report, but
this is still not a strong public "CE clearly wins" benchmark. The fixed CE run
resolved the right Store API, cart route, cart controller, session handler, and
cart session surfaces, and `ce_concepts` no longer fails. However, a full
two-loop `ce_query` exceeded the OpenAI token-per-minute limit during reviewer
input assembly, and a narrower one-loop run produced a useful but partial
answer.

## Run Metadata

| Run | Branch | Commit | Workspace | Method |
| --- | --- | --- | --- | --- |
| Baseline | `ce/context-engine` | prior May 29 run | `/Volumes/Lukes/Jeremy/Sites/atheory-ce-demo-wordpress` | Fresh agent using ordinary source discovery |
| CE-assisted | `ce/context-engine` | `3abff74` | `/Volumes/Lukes/Jeremy/Sites/atheory-ce-demo-wordpress` | Current CE binary at `/Volumes/Lukes/Jeremy/Sites/atheory-ce/ce`, OpenAI-backed `ce query` |

CE commit: `38cd896` (`Fail ce_query early without LLM credentials`)

CE data dir: `/private/tmp/ce-wp-openai-data`

## Current CE Verification

The full current query was run from the demo repo root with `--max-loops 2`.
CE correctly selected source-facing anchors, including:

- `demo/tasks/07-store-api-headless-cart-merge.md`
- `woocommerce/plugins/woocommerce/src/StoreApi/Authentication.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/CartTokenUtils.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/CartController.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Routes/V1/Cart.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Routes/V1/AbstractCartRoute.php`
- `woocommerce/plugins/woocommerce/includes/class-wc-cart-session.php`
- `woocommerce/plugins/woocommerce/includes/class-wc-session-handler.php`

Tool fan-out in the full run:

- `filecontext`: 43 emissions
- `references`: 124+ emissions
- `callgraph`: 104+ emissions
- `summary`: 10 emissions
- `concepts`: 37+ emissions
- `crossproject`: 0 emissions

This confirms the old `ce_concepts` schema bug is fixed. The previous report's
`SQL logic error: no such column: project_id` failure is no longer present.

The full two-loop run failed during loop 2 reviewer synthesis because the
OpenAI request exceeded TPM:

```text
429 Too Many Requests: limit 200000 TPM, requested 206049
```

A narrower one-loop run completed and produced a partial source-grounded answer.

## Correctness Findings From Current CE Run

The completed one-loop CE answer confirmed these source facts:

- `Routes\V1\Cart::get_path_regex()` returns `/cart`.
- `Routes\V1\Cart::get_args()` registers a readable route with
  `get_response`.
- `Routes\V1\Cart::get_route_response()` delegates to
  `CartController::get_cart_for_response()`.
- `AbstractCartRoute::get_response()` calls `load_cart_session($request)`
  before nonce validation and route dispatch.
- `AbstractCartRoute::add_response_headers()` emits `Nonce`,
  `Nonce-Timestamp`, `User-ID`, `Cart-Token`, `Cart-Hash`, and
  `Cache-Control: no-store`.
- `AbstractCartRoute::get_cart_token()` loads the cart and returns
  `CartTokenUtils::get_cart_token((string) wc()->session->get_customer_id())`.
- `Authentication::init()` hooks Store API auth/CORS behavior for Store API
  requests, including `rest_authentication_errors`, `set_logged_in_cookie`,
  CORS allowed headers, and CORS exposed headers.
- `Authentication::get_cart_token()` reads and sanitizes the `Cart-Token`
  request header.
- `CartController::load_cart()` calls `wc_load_cart()` if
  `woocommerce_load_cart_from_session` has not fired, sets
  `$cart->cart_context = 'store-api'`, and calls `$cart->get_cart()`.
- `WC_Session_Handler` imports `CartTokenUtils` and contains session-selection
  methods including `init_session_from_request()`,
  `migrate_guest_session_to_user_session()`, `restore_session_data()`, and
  `clone_session_data()`.
- `WC_Session_Handler::clone_session_data()` copies session data from another
  customer/session id, records `previous_customer_id`, removes `customer`, marks
  the data dirty, and saves it.
- `WC_Cart_Session` contains the cart restoration and persistence surface:
  `get_cart_from_session()`, `get_cart_for_session()`, `set_session()`,
  `get_saved_cart()`, and `persistent_cart_update()`.

## Remaining Gaps

The current CE run still missed or only partially surfaced several decisive
pieces:

- The task markdown body was not included in the final evidence even though the
  task file was anchored. This suggests file-context should include raw source
  excerpts for file anchors with no indexed symbols, such as Markdown task
  files.
- The full body of `CartTokenUtils.php` was not included in the final answer.
- The full body of `AbstractCartRoute::load_cart_session()` was not included,
  so the exact token/session attachment path remains incomplete.
- The full bodies of `WC_Session_Handler::init_session_from_request()`,
  `init_session_cookie()`, `migrate_guest_session_to_user_session()`, and
  `restore_session_data()` were not included.
- The full body of `WC_Cart_Session::get_cart_from_session()` was not included,
  so the exact persistent-cart merge/overwrite behavior remains incomplete.
- Tests were not surfaced well enough. The run found generic cart tests but not
  a complete Store API cart-token/login merge test surface.
- Full two-loop investigation currently risks exceeding provider TPM because
  reviewer input receives too many emissions from high-fanout tools.

## Comparison To Baseline

The earlier baseline broad-search run reached a more complete diagnosis for
this task. It connected JWT/current-user authentication, Store API cart token
session selection, WooCommerce login hooks, persistent cart loading, and
possible overwrite behavior.

The fixed CE run now gets to the right source neighborhood without broad shell
search, which is valuable. But on this specific issue, the current `ce_query`
path did not yet outperform the broad-search baseline on correctness or depth.

| Dimension | Baseline broad search | Current CE-assisted run |
| --- | --- | --- |
| Valid run | Yes | Partial: one-loop completed; two-loop exceeded TPM |
| Broad fallback | n/a | 0 broad shell discovery actions |
| Source neighborhood | High | High |
| Method-body depth | High | Medium |
| Test surface | High | Low/medium |
| Root-cause confidence | High | Medium |
| Release-demo strength | Strong task, baseline strong | Useful engineering signal, not a public win yet |

## Release Implication

This benchmark is still useful, but not yet the flagship proof. It shows CE can
find the right large-codebase neighborhood and now uses fixed concepts/source
retrieval, but it also exposes the next quality issues:

- control reviewer/fanout token volume before provider limits
- surface raw file content for CE-identified non-code files
- pull decisive method bodies more consistently
- improve test-neighbor retrieval
- possibly add a composed "trace flow around this source task" direct tool

For release readiness, the current result is acceptable as an internal
validation artifact, not as a public comparison claim that CE clearly beats a
strong baseline.
