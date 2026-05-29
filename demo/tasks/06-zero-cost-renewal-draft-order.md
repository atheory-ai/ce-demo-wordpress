# Task 06: Zero-Cost Renewal Draft Order Regression

Investigate WooCommerce issue #50328:

https://github.com/woocommerce/woocommerce/issues/50328

## Issue Summary

A WooCommerce + Woo Subscriptions + coupon flow can create an orphan order when
a pending or failed renewal/manual checkout order has a total of zero. The issue
report says Store API checkout creates a new draft order rather than reusing the
existing order. The new order lacks renewal metadata and has a blanked
`order_type`, so the subscription remains on hold or disconnected from the
processed order.

The reporter points at `DraftOrderTrait::is_valid_draft_order()` and argues
that `needs_payment()` returns false for zero-total pending/failed orders. They
suggest that such orders should still be considered valid draft orders, or that
third-party plugins need a filter around the draft-order validation decision.

## Benchmark Goal

Determine whether the root cause is actually:

- `DraftOrderTrait::is_valid_draft_order()`
- `WC_Order::needs_payment()` semantics
- pending/failed order status handling
- Store API checkout draft-order selection
- missing preservation of renewal/subscription metadata
- coupon/zero-total order behavior
- missing extension point for third-party order reuse

## Expected Investigation

- Trace how Store API checkout selects, creates, validates, and reuses draft
  orders.
- Identify why a zero-total pending/failed order might be rejected.
- Determine whether changing `needs_payment()` logic is safe or too broad.
- Find where order type and renewal/subscription metadata could be lost when a
  new draft order is created.
- Identify source files and tests that should change.
- Propose the safest fix and explain risks.

## Evaluation Questions

- Does the investigation avoid blindly accepting the reporter's proposed fix?
- Does it distinguish a draft-order validation bug from a payment/order-status
  semantic change?
- Does it identify the exact Store API draft order path?
- Does it identify where to add tests for zero-total pending/failed order reuse?
- Does it identify whether a filter is safer than changing core
  `needs_payment()` behavior?

