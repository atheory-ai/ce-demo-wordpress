# Framework semantic-policy catalog

This catalog is a deliberately bounded demo of how CE turns a natural-language
change request into an implementation contract. It is not a claim that every
legacy pattern in the indexed repositories is ideal. Policies favor current,
documented WordPress ecosystem guidance and activate only when the shaped or
resolved plan establishes the necessary controlled semantic tags.

## Evidence used

- [WordPress security guidance](https://developer.wordpress.org/apis/security/):
  validate untrusted input, escape late, and prefer platform APIs.
- [WordPress nonces](https://developer.wordpress.org/apis/security/nonces/): a
  nonce is CSRF protection, not authorization; use capabilities for access
  control.
- [WordPress PHP coding standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/): use platform APIs where possible;
  prepare raw `$wpdb` queries at the query boundary; follow WPCS.
- [WooCommerce coding standards](https://developer.woocommerce.com/docs/best-practices/coding-standards/)
  and [linting guidance](https://developer.woocommerce.com/testing-extensions-and-maintaining-quality-code/setting-up-linting/): hooks, i18n, modularity, WooCommerce
  Sniffs, and WordPress standards.
- [WooCommerce security guidance](https://developer.woocommerce.com/docs/best-practices/security/security-best-practices): prepared queries, validation, and PHPCS/Semgrep gates.
- [Block metadata guidance](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/)
  and [block registration guidance](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/): `block.json` metadata and server/client registration.
- [Gutenberg i18n](https://developer.wordpress.org/block-editor/how-to-guides/internationalization/),
  [coding guidelines](https://developer.wordpress.org/block-editor/contributors/code/coding-guidelines/), and
  [accessibility guidance](https://developer.wordpress.org/block-editor/contributors/accessibility-testing/).

The checked-in source supports these choices: WooCommerce’s `CartController`
uses the cart/controller boundary and distinguishes Store API behavior from
classic notices; Gutenberg block-library entries repeatedly import
`block.json`, use `useBlockProps`, and wrap UI strings with `@wordpress/i18n`.

## Packs

| Pack | Controlled tags required | Resulting implementation obligation |
| --- | --- | --- |
| WordPress | `surface.wordpress.request` + `input.user_controlled` | Validate expected input and sanitize when necessary. |
| WordPress | `surface.wordpress.request` + `operation.mutate` | Verify a nonce for CSRF; never mistake it for authorization. |
| WordPress | `surface.wordpress.admin` + `operation.mutate` | Require the least-privileged relevant capability. |
| WordPress | `output.html` + `input.user_controlled` | Escape late with the context-correct WordPress helper. |
| WordPress | `effect.database.query` | Prefer platform APIs; prepare unavoidable raw `$wpdb` queries. |
| WooCommerce | `context.woocommerce.cart` + `operation.cart.modify` | Use Woo cart/customer APIs and preserve recalculation/session behavior. |
| WooCommerce | cart mutation + `input.user_controlled` | Validate product, variation, quantity, and cart-item input. |
| WooCommerce | `context.woocommerce.checkout` + `operation.checkout.validate` | Use the checkout validation hook/contract and the correct error channel. |
| WooCommerce | `surface.woocommerce.store_api` + `operation.mutate` | Return errors using the Store API response contract, not classic notices. |
| Gutenberg | `context.gutenberg.block` + `operation.block.register` | Use `block.json` metadata and server/client registration. |
| Gutenberg | block + `surface.gutenberg.editor` | Use the appropriate block-props API for editor/save markup. |
| Gutenberg | Gutenberg + user-facing text | Use `@wordpress/i18n` with the established domain. |
| Gutenberg | editor + HTML | Preserve keyboard operation, names, focus behavior, and semantic markup. |

Quality requirements are emitted as post-write gates (WPCS, WooCommerce Sniffs,
or public Gutenberg package API boundaries). They guide the implementation
agent, then the verification tooling checks the result; they are not treated as
source-generating rules.

## Deliberate boundaries

- The policy packs do **not** require authentication for every cart change:
  customer-session cart changes and privileged admin operations have different
  authority models.
- A Store API request does not receive the classic checkout notice obligation.
- Tags proposed from natural language remain inferred until target resolution or
  plugin/graph evidence confirms them. Missing or conflicting context blocks a
  packet instead of creating a plausible-looking but unsafe answer.
