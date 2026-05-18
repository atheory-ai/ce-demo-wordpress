# 03 Source Constellation

## Initial Source Set

The initial demo should use upstream source repositories as pinned submodules:

| Path | Repository | Why It Matters |
| --- | --- | --- |
| `wordpress/` | WordPress core | PHP runtime, hooks, filters, REST APIs, block integration, backward compatibility. |
| `gutenberg/` | Gutenberg editor | React/TypeScript editor, block registration, packages, build metadata, REST interactions. |
| `woocommerce/` | WooCommerce | Large real plugin, checkout/order/product domain, extension points, WordPress integration. |

This should be enough for the first flagship demo. Additional plugins should be
added only when they support a specific scenario.

## Optional Later Additions

Potential extra source repos:

- WooCommerce Blocks if needed separately from WooCommerce.
- A payment gateway plugin for checkout and order lifecycle scenarios.
- A subscriptions or memberships plugin for recurring billing/account lifecycle.
- A popular block library for third-party Gutenberg extension scenarios.

Do not add plugins solely to increase line count. Complexity should be tied to a
demonstrable task.

## Source-Only Constraint

The first demo should not require running WordPress. The source constellation is
used for code understanding, architecture tracing, and agent context evaluation.

This avoids turning the demo into:

- PHP environment setup
- local database setup
- web server setup
- WordPress admin configuration
- browser automation

## Pinning

Every source submodule must be pinned to a known commit. The README should
record:

- upstream URL
- pinned commit
- date chosen
- reason the version was chosen

Pinned versions should be periodically refreshed, but benchmark results should
always identify the source SHAs used.
