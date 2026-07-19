# WordPress semantic-boundary fixture

This small PHP-only fixture exercises the bounded vocabulary in
`specs/21-WORDPRESS-WOOCOMMERCE-SEMANTIC-VOCABULARY.md`:

- a hook registration;
- a REST route with callback and permission callback;
- block registration with render/editor configuration;
- Additional Checkout Field registration;
- Store API endpoint-data registration;
- observed capability/sanitization/error APIs; and
- an observed cart mutation.

It is deliberately not a claim that the callback is authorized, that input is
safe, or that the cart effect executes at runtime. Those require future
flow-sensitive claims and coverage evidence.

Run after building both demo plugins:

```sh
CE_BIN=/path/to/ce scripts/ce-index.sh --full demo/fixtures/wordpress-semantics
```
