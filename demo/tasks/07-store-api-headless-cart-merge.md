# Task 07: Store API Headless Cart Merge Regression

Investigate WooCommerce issue #55653:

https://github.com/woocommerce/woocommerce/issues/55653

## Issue Summary

A headless WooCommerce site using the Store API cannot reliably merge a guest
cart into the authenticated user's cart after login.

The reported flow:

- the frontend is a separate Next.js application
- guest requests send `Cart-Token` and `Nonce`
- authenticated requests send JWT bearer auth, `Cart-Token`, and `Nonce`
- after login, the guest cart is not merged into the saved user cart
- with `Cart-Token`, the guest cart appears to override the logged-in cart
- without `Cart-Token`, only the saved logged-in cart appears
- if custom backend code manually calls `wp_set_current_user()`,
  `wp_set_auth_cookie()`, and `do_action( 'wp_login', ... )`, cart merging works

The issue is open, labeled as a confirmed cart/Store API bug, and has no linked
development branch or pull request.

## Benchmark Goal

Determine the most likely root cause and safest fix strategy without relying on
the reporter's speculation.

The investigation should determine whether the behavior is controlled by:

- Store API authentication and request bootstrap order
- cart token resolution
- session/customer resolution
- WordPress `determine_current_user` handling
- WooCommerce cart session persistence
- login hooks or auth-cookie side effects
- cart merge timing during Store API request handling

## Expected Investigation

- Trace how Store API requests establish the current customer and cart session.
- Trace how `Cart-Token`, nonce, and authenticated user state interact.
- Identify where guest cart data is selected, persisted, or discarded.
- Identify where authenticated-user saved cart data is loaded.
- Identify where guest and authenticated carts are supposed to merge.
- Determine whether JWT-authenticated REST requests are expected to trigger the
  same side effects as a normal WordPress login.
- Find source files and tests that should change.
- Propose a safe fix that does not assume all headless integrations use cookies.

## Evaluation Questions

- Does the investigation find the actual Store API cart/session/auth control
  flow rather than stopping at `get_current_user_id()`?
- Does it distinguish request authentication from login side effects?
- Does it identify where `Cart-Token` can override saved customer cart state?
- Does it find the right test surface for cart merge behavior?
- Does it avoid recommending broad changes to WordPress auth/session semantics?
- Does it clearly separate confirmed facts from hypotheses requiring runtime
  reproduction?
