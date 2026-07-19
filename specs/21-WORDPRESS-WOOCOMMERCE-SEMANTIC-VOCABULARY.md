# 21 — WordPress and WooCommerce Semantic Vocabulary

## Purpose

Turn the demo's PHP plugins from a small convention detector into an
evidence-bearing, intentionally bounded semantic vocabulary for WordPress and
WooCommerce. This is a capability specification for the `ce` branch, not a
claim that dynamic PHP behaviour is generally resolved or verified.

## Source contracts

This vocabulary is anchored in the public platform documentation, not inferred
from naming conventions alone:

- [WordPress REST routes and endpoint callbacks](https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/)
- [WordPress nonce limits and capability checks](https://developer.wordpress.org/apis/security/nonces/)
- [WordPress block server/client registration](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/)
- [WooCommerce Store API scope and extension model](https://developer.woocommerce.com/docs/apis/store-api/)
- [WooCommerce Store API endpoint data extensions](https://developer.woocommerce.com/docs/apis/store-api/extending-store-api/extend-store-api-add-data/)
- [WooCommerce Cart API request/response contract](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart/)
- [WooCommerce additional checkout-field contract](https://developer.woocommerce.com/docs/block-development/extensible-blocks/cart-and-checkout-blocks/additional-checkout-fields/)

The vocabulary is derived from the public platform contracts:

- WordPress REST routes are registered on `rest_api_init` and have endpoint and
  permission callbacks;
- nonces are not authorization and capability checks remain required;
- blocks have server/client registration and optional render boundaries;
- WooCommerce Store API cart and checkout operations are current-customer
  scoped, token/nonced where required, and return updated resources; and
- Store API extension data is namespaced and declared through endpoint schema
  and data callbacks.

## Model layers

### 1. PHP language facts

The PHP language plugin owns source structure: files, namespaces, classes,
functions, methods, imports, and the source ranges that establish those facts.
It must not claim call-target resolution or runtime control flow when PHP's
dynamic dispatch prevents proof.

### 2. WordPress and WooCommerce observed facts

The convention plugin enriches a parsed PHP CST with facts that cite the call
site and retain raw callback/configuration expressions. Its facts are
**observed**, not an assertion that callbacks execute or that a route is safe.

| Fact | Required evidence | Important properties |
| --- | --- | --- |
| `wordpress_hook` | `add_action`, `add_filter`, `do_action`, or `apply_filters` call | phase, hook kind, callback expression, priority, accepted args |
| `wordpress_rest_route` | `register_rest_route` call | namespace, route, methods, callback, permission callback presence, argument declaration presence |
| `wordpress_block` | `register_block_type` call | identifier/path expression, metadata/path mode, render callback, editor script |
| `woocommerce_checkout_field` | `woocommerce_register_additional_checkout_field` call | ID, location, type, required state, validation/sanitization callbacks |
| `woocommerce_store_api_extension` | documented Store API extension registration call | operation, endpoint, namespace, data/schema/update callbacks |
| `wordpress_security_boundary` | direct capability, nonce, sanitization, escaping, or response/error API call | category, API, raw input expression where available |
| `woocommerce_cart_effect` | directly observed cart mutation API call | operation, receiver expression, arguments |

Facts may be connected to their source file and to other facts emitted by the
same extraction result. They must never emit an edge to an unobserved callback
symbol merely because a string or dynamic callable resembles one.

### 3. Semantic claims and policy passes

Only facts with enough source evidence may be lifted into IIR claims. Examples:

- an observed Store API extension declares an endpoint/schema/data boundary;
- an observed cart mutation is an external state effect;
- an observed REST route has a permission callback expression.

These are not enough to claim authorization, sanitization-before-use,
callback ordering, response-schema correctness, or runtime cart/session
behaviour. Those require a future flow-sensitive, source-evidenced model.

Policy passes consume the facts/claims separately from extraction. Candidate
policies include: mutation requires an audit boundary, route requires explicit
permission handling, Store API extension data must be namespaced, and sensitive
data must not be exposed through public Store API responses. Policies must
report **inconclusive** when the extractor lacks coverage.

## Delivery order

1. Make convention facts self-contained and stable, including a file node in
   each convention result so write ordering cannot leave its facts orphaned.
2. Add golden fixtures for route callbacks/permission configuration, block
   render configuration, Store API extension registration, security APIs, and
   cart effects. Include negative cases and dynamic/unsupported cases.
3. Add fixture indexing assertions for all fact types and relation integrity.
4. Add a source-evidenced claim layer with coverage states; only then add policy
   rules and positive/negative/inconclusive IIR verification fixtures.
5. Add the matching TypeScript/Gutenberg and Woo block-store facts so an agent
   can follow a real server-to-client flow. PHP enrichment alone cannot solve
   that cross-language requirement.

## Acceptance criteria for this phase

- Every emitted fact has a source file/range and raw observed expressions.
- The plugin does not make a security or runtime-correctness verdict.
- Facts are robust to literal, array, callable-array, closure, and dynamic
  expressions by preserving unknown expressions rather than guessing.
- Tests prove positive, absent, and unresolved/dynamic cases.
- Full-corpus indexing has no orphan-edge/write-buffer warnings.
