# WordPress checkout semantic-policy fixture

The `wordpress-conventions` plugin declares two PHP policies for a plan with
the explicit or observed claim `context.woocommerce.checkout`:

1. invoke `woocommerce_after_checkout_validation` for checkout validation;
2. report validation failure through WooCommerce errors rather than throwing.

These are implementation-packet requirements, not source-verification claims.
They remain inactive for generic PHP and for PHP plans without checkout context.
The policy source is [the demo plugin](../../plugins/wordpress-conventions/src/index.ts).
