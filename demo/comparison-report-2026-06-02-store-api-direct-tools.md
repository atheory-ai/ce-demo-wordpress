# Comparison Report: Store API Headless Cart Merge, Direct CE Tools

## Summary

This run compares a fresh baseline agent using ordinary source discovery
against a fresh CE-assisted agent constrained to CE direct MCP tools for
discovery. It does not use `ce_query`.

Primary scoring is correctness and depth. Time and request counts are telemetry.

Result: CE did catch useful subtle context that the baseline did not cite, but
the baseline was already highly accurate. This is a valid CE-direct-tools
benchmark and a good internal release signal, but it is not yet a decisive
public correctness win.

## Run Metadata

| Run | Worktree | Commit | Method |
| --- | --- | --- | --- |
| Baseline | `/Volumes/Lukes/Jeremy/Sites/atheory-ce-demo-wordpress` | current | Fresh agent, broad `rg`/file discovery allowed |
| CE-assisted | `/Volumes/Lukes/Jeremy/Sites/atheory-ce-demo-wordpress` | current | Fresh agent, CE direct MCP tools for discovery, no broad fallback |

CE binary: `/Volumes/Lukes/Jeremy/Sites/atheory-ce/ce`

CE data dir: `/private/tmp/ce-demo-ce-data`

CE status reported:

- Project: `git@github.com:atheory-ai/ce-demo-wordpress.git`
- Status: indexed
- Nodes: 129218
- Edges: 165255
- Last indexed: 2026-05-29T18:00:40-07:00

## Measurements

| Metric | Baseline | CE-assisted |
| --- | --- | --- |
| Context-ready time | about 20 minutes | about 25 minutes after CE setup |
| Discovery actions | about 54 shell/source actions | about 76 CE `tools/call` requests |
| Broad fallback | n/a | 0 |
| Source reads | Broad source reads allowed | Narrow reads after CE-cited files/symbols |
| Valid benchmark discipline | Yes | Yes |

These measurements are not the weighted result. The weighted result is whether
CE produced a more accurate or materially deeper answer.

## Correctness Delta

| Finding | Baseline | CE-assisted | Impact |
| --- | --- | --- | --- |
| Major facts caught only by CE | Did not cite `StoreApi::init()` installing the Store API session-handler filter. | Cited `StoreApi::init()` and tied it to `Authentication::maybe_use_store_api_session_handler`. | Useful. It makes the Store API bootstrap path more explicit. |
| Major facts caught only by CE | Did not cite default cookie session migration. | Cited `WC_Session_Handler::init_session_from_request()` migration behavior. | Useful contrast between cookie login and Store API token sessions. |
| Subtle facts caught only by CE | Did not cite token payload shape. | Cited `CartTokenUtils` payload containing `user_id`, `exp`, and issuer. | Useful for designing a safe promotion/merge guard. |
| Subtle facts caught only by CE | Did not cite `wc_load_cart()` initialization order. | Cited `wc_load_cart()` initializing session before cart. | Useful because it explains why the session handler choice controls cart load. |
| Subtle facts caught only by CE | Suggested route/session tests generally. | Named `SessionHandlerTest.php` and `CartTokenUtilsTests.php` as direct test surfaces. | Better test targeting. |
| Major facts caught only by baseline | Cited WordPress `wp_signon()` and `determine_current_user` contrast. | Did not cite WordPress auth internals. | Baseline better explained why JWT can set current user without login side effects. |
| Subtle facts caught only by baseline | Cited `WC()->customer` initialization from `get_current_user_id()`. | Did not cite this path. | Baseline better explained why user and session identity can diverge. |
| Subtle facts caught only by baseline | Cited persistent cart update hooks and overwrite risk on later mutations. | Did not emphasize overwrite risk. | Baseline better captured follow-on data-loss risk. |
| Incorrect or unsupported claims | None obvious. | None obvious, but proposed changing session customer id before cart loading needs careful security tests for another user's token. | Both answers were source-grounded. |
| Safer final implementation guidance | Strong. Avoided auth-cookie/login fixes and proposed Store API-specific migration. | Strong. Avoided auth-cookie/login fixes and proposed Store API token-session promotion with tests. | Tie, with CE slightly better on test surfaces and baseline slightly better on auth/current-user contrast. |

## Baseline Answer Quality

The baseline correctly identified the core issue:

- a valid `Cart-Token` makes Store API use its token session handler
- the token handler loads by token payload rather than authenticated WordPress
  current user
- saved-cart merge normally depends on `_woocommerce_load_saved_cart_after_login`
  or an empty session cart
- JWT/current-user auth does not imply the WooCommerce login side effects
- the fix should be Store API cart/session migration, not broad auth changes

The baseline was unusually strong for a naked source-search run. It found the
important auth/session/cart split and avoided the tempting but shallow
`wp_set_current_user()` explanation.

## CE-Assisted Answer Quality

The CE-assisted run was valid and disciplined:

- `ce_query` was not used
- no broad `rg`, `find`, or `ls` fallback was used for discovery
- source reads were narrow and traceable to CE-cited files or symbols
- CE surfaced the core Store API session/cart/token neighborhood

CE found the same root cause as baseline and added useful supporting context:

- Store API bootstrap installs the session-handler filter
- Store API token sessions lack the default cookie-session migration path
- `CartTokenUtils` payload shape constrains safe migration logic
- `wc_load_cart()` initializes session before cart
- `SessionHandlerTest.php` is a good direct regression-test surface

## Assessment

CE improved depth in a few important places, especially around the Store API
bootstrap path, token payload shape, session-before-cart ordering, and direct
test targeting. Those are real correctness-supporting details.

However, the baseline also found important context CE did not emphasize:

- WordPress current-user auth can happen without login side effects
- WooCommerce customer identity can initialize from current user while session
  identity remains token-based
- later cart mutations may overwrite persistent cart state

The result is therefore a nuanced CE benefit, not a decisive win. CE direct tools
did make the agent avoid broad search entirely and still reach a high-quality,
source-grounded diagnosis. It did catch subtle things the naked run missed, but
the naked run also caught subtle things CE missed.

## Release Signal

This is a useful v1 release benchmark because it validates the intended surface:
agent harness plus deterministic CE MCP tools, with `ce_query` disabled.

For a stronger public demo, we still need either:

- a task where broad source search lands on a plausible but wrong explanation
  and CE reliably corrects it, or
- a richer CE tool composition that reduces the 76-request search burden while
  retaining the correctness gains.

