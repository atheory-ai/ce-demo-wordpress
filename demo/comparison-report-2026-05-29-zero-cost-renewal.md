# Benchmark Comparison: Zero-Cost Renewal Draft Order Regression

## Summary

This benchmark compares two fresh agents on an arcane real WooCommerce issue:

WooCommerce issue #50328: zero-cost renewal/manual checkout orders can create a
new orphan Store API draft order instead of reusing an existing pending/failed
renewal order.

Task: `demo/tasks/06-zero-cost-renewal-draft-order.md`

Correctness is the primary metric. Speed and request count are secondary unless
they are extreme.

Result: both baseline and CE-assisted agents reached the same core diagnosis:
`DraftOrderTrait::is_valid_draft_order()` incorrectly uses
`WC_Order::needs_payment()` as the reuse gate for pending/failed Store API
orders. Because `needs_payment()` requires `total > 0`, zero-total pending or
failed orders fail reuse even when the cart hash matches. Store API then creates
a fresh `checkout-draft` order, losing extension metadata from the original
renewal/manual order.

CE did not provide a correctness win on this issue. It found the important
trait and source path, but it needed broad fallback to locate callers/tests and
arrived at essentially the same diagnosis as baseline.

## Setup

| Run | Branch | Commit | Workspace | Method |
| --- | --- | --- | --- | --- |
| Baseline | `baseline/source-constellation` | `be8c5f1` | `/private/tmp/ce-demo-baseline` | Fresh subagent using broad source discovery |
| CE-assisted | `ce/context-engine` | `0b80467` | `/Volumes/Lukes/Jeremy/Sites/atheory-ce-demo-wordpress` | Fresh subagent using CE MCP search first |

CE setup overhead:

- CE data dir: `/private/tmp/ce-demo-ce-data`
- Existing index: WordPress demo corpus with PHP/TS/Python/Go plugins
- MCP graph search verified before run

## Primary Comparison

| Metric | Baseline | CE-assisted | Winner |
| --- | --- | --- | --- |
| Valid run | Yes | Partly; CE used fallback | Baseline |
| Time to context-ready | ~18m | ~15m after setup | CE, small |
| Broad lookup/search requests | ~11 | 3 fallback searches | CE |
| CE/harness requests | n/a | 29 attempted, 26 completed | Baseline on total request count |
| Files read/cited | 10 | 7 | CE, slightly |
| Root cause accuracy | High | High | Tie |
| Depth | High | High | Tie |
| Test-plan quality | High | High | Tie |
| Correctness win | No | No | Tie |

## Correctness Findings

Both agents identified the same source-backed root cause:

- Store API checkout retrieves the session order through
  `DraftOrderTrait::get_draft_order()`.
- `get_draft_order()` returns the session order only when
  `is_valid_draft_order()` passes.
- `is_valid_draft_order()` accepts `checkout-draft` orders, or pending/failed
  orders only when `needs_payment()` is true and the cart hash matches.
- `WC_Order::needs_payment()` intentionally means "payable now": valid payment
  status and `get_total() > 0`.
- A zero-total pending/failed order therefore fails the Store API reuse
  predicate even if it is the intended renewal/manual checkout order.
- Store API then creates a new `checkout-draft` order from cart state, which
  explains how renewal/subscription metadata can be bypassed or lost.

Both agents also reached the same safety conclusion:

- Do not change `WC_Order::needs_payment()` globally.
- Fix the Store API draft-order reuse predicate instead.
- Preserve cart-hash protection.
- Add regression tests for zero-total pending/failed order reuse.
- Consider a narrow filter around the draft-order validation decision if
  extension-specific order reuse needs to opt in.

## Baseline Run

Elapsed wall-clock estimate: ~18 minutes.

Broad lookup/search requests: ~11.

Unique source files read/cited: 10.

Important files found:

- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/DraftOrderTrait.php`
- `woocommerce/plugins/woocommerce/includes/class-wc-order.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/OrderController.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/CheckoutTrait.php`
- `woocommerce/plugins/woocommerce/includes/class-wc-checkout.php`
- `woocommerce/plugins/woocommerce/tests/php/src/Blocks/StoreApi/Routes/Checkout.php`
- `woocommerce/plugins/woocommerce/tests/legacy/unit-tests/order/class-wc-tests-crud-orders.php`

Baseline strengths:

- Found `class-wc-checkout.php`, which provides a useful contrast: classic
  checkout reuses matching pending/failed orders by status and cart hash rather
  than by `needs_payment()`.
- Found existing order tests proving `needs_payment()` intentionally returns
  false for pending zero-total orders.
- Found the Store API checkout regression test area.
- Clearly distinguished metadata loss as a consequence of replacement, not the
  first failing condition.

Baseline likely misses:

- Woo Subscriptions internals are not in this demo corpus, so renewal metadata
  specifics remain inferred from the issue.

## CE-Assisted Run

Elapsed wall-clock estimate after setup: about 15 minutes.

CE MCP usage:

- 29 requests attempted
- 1 `ce_status`
- 28 `ce_search`
- 26 completed
- 2 failed with `database is locked`

Broad fallback count: 3.

Fallback reason:

- CE found the trait and key symbols, but did not reliably surface callers and
  tests. The agent used fallback source search to locate the route caller and
  existing test area.

Important files found:

- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/DraftOrderTrait.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/OrderController.php`
- `woocommerce/plugins/woocommerce/includes/class-wc-order.php`
- `woocommerce/plugins/woocommerce/tests/php/src/Blocks/StoreApi/Routes/Checkout.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/CheckoutTrait.php`

CE strengths:

- Quickly found the key `DraftOrderTrait` and `needs_payment()` relationship.
- Used fewer files to reach the same diagnosis.
- Avoided changing global payment semantics in its fix plan.

CE weaknesses:

- Needed many search requests.
- Hit read-path database locks.
- Needed broad fallback for callers/tests.
- Did not find the classic checkout contrast or legacy `needs_payment()` tests
  that baseline found.

## Quality Scoring

| Dimension | Baseline | CE-assisted | Notes |
| --- | --- | --- | --- |
| Root cause accuracy | 5/5 | 5/5 | Both identified the Store API reuse predicate as the core issue. |
| Avoids unsafe fix | 5/5 | 5/5 | Both avoided changing `needs_payment()` globally. |
| Source coverage | 5/5 | 4/5 | Baseline found classic checkout contrast and legacy order tests. |
| Test-plan quality | 5/5 | 5/5 | Both proposed zero-total pending/failed Store API regression tests. |
| Extension-risk handling | 4/5 | 4/5 | Both noted Subscriptions internals are absent from the corpus. |
| CE discipline | n/a | 3/5 | CE used graph search first but required 3 broad fallbacks. |

## Conclusion

This is a better benchmark task than the checkout-field overview because it is
arcane and correctness-focused. It forced both agents to distinguish an obvious
but unsafe global semantic change from a narrower Store API draft-order reuse
bug.

However, CE still did not demonstrate a correctness advantage on this task.
Baseline broad search found a complete, high-quality diagnosis and even surfaced
two useful supporting contexts CE missed:

- classic checkout's status/cart-hash reuse behavior
- existing `needs_payment()` tests documenting zero-total behavior

The CE result was still useful: it got to the same root cause with fewer cited
files and fewer broad searches. But because it required many MCP searches,
database-lock retries, and broad fallback for callers/tests, it is not yet a
compelling public correctness demo.

Next CE improvements suggested by this run:

- expose caller/reference search through MCP, not just substring search
- expose test-neighbor search for a surfaced symbol/file
- include file path and line hints directly in richer CE search output
- eliminate SQLite lock errors for read-only MCP searches during benchmarks
- add relationship edges for trait method callers and PHP method references

