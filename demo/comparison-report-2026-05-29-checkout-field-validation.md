# Benchmark Comparison: Checkout Field Validation

## Summary

This benchmark compares two fresh agents on the same source-understanding task:

- Baseline: ordinary source discovery against the WordPress demo source tree.
- CE-assisted: Context Engine graph search first, with only narrow source reads
  after CE surfaced relevant files.

Task: `demo/tasks/02-checkout-field-validation.md`

Result: CE produced a valid, source-grounded understanding with no broad
filesystem fallback, and it surfaced some deeper validation/persistence context.
It did not improve speed or request count in this run. The baseline was faster
and more efficient.

## Setup

| Run | Branch | Commit | Workspace | Method |
| --- | --- | --- | --- | --- |
| Baseline | `baseline/source-constellation` | `be8c5f1` | `/private/tmp/ce-demo-baseline` | Fresh subagent using `rg` and file reads |
| CE-assisted | `ce/context-engine` | `0b80467` | `/Volumes/Lukes/Jeremy/Sites/atheory-ce-demo-wordpress` | Fresh subagent using CE MCP `ce_status` and `ce_search` first |

CE setup overhead:

- CE data dir: `/private/tmp/ce-demo-ce-data`
- Index result: `21,114 files indexed`, `181,496 nodes`, `165,259 edges`
- Skipped: `12,677 files`
- Index duration: `2m57.433s`

Indexing time is setup overhead, not context-acquisition time.

## Primary Comparison

| Metric | Baseline | CE-assisted | Winner |
| --- | --- | --- | --- |
| Valid run | Yes | Yes | Tie |
| Time to context-ready | `2m16s` | `5m34s` after setup | Baseline |
| Broad lookup/search requests | 9 | 0 | CE |
| CE/harness requests | n/a | 32 MCP requests | Baseline on total request count |
| Files read | 19 | about 13 plus task file | CE, slightly |
| Files cited | 10 | 10 | Tie |
| Relationship depth | Good | Good, slightly deeper on schema validation/persistence | CE, slight |
| Accuracy | Good | Good | Tie |
| Unsupported-claim risk | Low for main path, medium for classic parity | Low for PHP/server path, medium for exact client UI validation | Tie |
| Overall demo impact | Fast and effective with broad search | More constrained and graph-guided, but slower/noisier | Mixed |

## Baseline Run

Elapsed wall-clock estimate: `2m16s`, from `10:10:45` to `10:13:01 PDT`.

Broad lookup/search requests:

- 9 total
- 1 `ls`
- 8 `rg` searches
- 1 search had a shell quoting failure

Files read: 19.

Files cited:

- `woocommerce/plugins/woocommerce/src/Blocks/Domain/Services/functions.php`
- `woocommerce/plugins/woocommerce/src/Blocks/Domain/Services/CheckoutFields.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Schemas/V1/CheckoutSchema.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Schemas/V1/AbstractAddressSchema.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/CheckoutTrait.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/OrderController.php`
- `woocommerce/plugins/woocommerce/client/blocks/assets/js/base/context/providers/cart-checkout/checkout-processor.ts`
- `woocommerce/plugins/woocommerce/client/blocks/assets/js/blocks/checkout/inner-blocks/checkout-contact-information-block/block.tsx`
- `woocommerce/plugins/woocommerce/client/blocks/assets/js/blocks/checkout/inner-blocks/checkout-additional-information-block/block.tsx`

What it understood:

- The safe extension entry point is
  `woocommerce_register_additional_checkout_field()`, which waits for
  `woocommerce_blocks_loaded` and delegates to
  `CheckoutFields::register_checkout_field()`.
- Field definitions include ID, location, type, required/hidden state,
  callbacks, and schema-like validation rules.
- Contact and order fields render through React checkout inner blocks and write
  values into checkout state.
- Checkout submission posts `additional_fields`, billing/shipping addresses,
  account flags, order notes, extension data, and payment data to
  `/wc/store/v1/checkout`.
- Server-side handling flows through `CheckoutSchema`, `Checkout`,
  `CheckoutTrait`, `OrderController`, and `AbstractAddressSchema`.

Likely misses:

- Exact frontend source for address block field composition beyond the shared
  form layer.
- Public documentation wording for third-party developers.
- Full Gutenberg block registration/render pipeline, which was not central to
  this task.
- Tests for failed Store API validation response mapping to specific UI fields.

Assessment:

The baseline result was strong: fast, accurate, and source-cited. It required
broad source lookup, but for this task the broad search was efficient.

## CE-Assisted Run

Elapsed wall-clock after setup: `5m34s`.

CE request count:

- 32 MCP requests
- Included `ce_status`, `tools/list`, successful searches, no-hit searches, and
  one failed locked-DB request

Broad fallback count:

- 0

Narrow verification:

- A few `sed`/`nl` reads.
- `rg` was used only within CE-surfaced files/directories.

Files read:

- task file
- `CheckoutFields.php`
- `CheckoutFieldsFrontend.php`
- `CheckoutFieldsSchema/Validation.php`
- `functions.php`
- Store API `Checkout.php`
- `CheckoutTrait.php`
- `CheckoutSchema.php`
- checkout block PHP
- checkout React contact/billing/additional information blocks
- checkout data store files
- default field settings/constants
- `push-changes.ts`

Files cited:

- `woocommerce/plugins/woocommerce/src/Blocks/Domain/Services/CheckoutFields.php`
- `woocommerce/plugins/woocommerce/src/Blocks/Domain/Services/functions.php`
- `woocommerce/plugins/woocommerce/src/Blocks/Domain/Services/CheckoutFieldsSchema/Validation.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Routes/V1/Checkout.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Utilities/CheckoutTrait.php`
- `woocommerce/plugins/woocommerce/src/StoreApi/Schemas/V1/CheckoutSchema.php`
- `woocommerce/plugins/woocommerce/client/blocks/assets/js/settings/blocks/constants.ts`
- `woocommerce/plugins/woocommerce/client/blocks/assets/js/blocks/checkout/inner-blocks/checkout-contact-information-block/block.tsx`
- `woocommerce/plugins/woocommerce/client/blocks/assets/js/blocks/checkout/inner-blocks/checkout-additional-information-block/block.tsx`
- `woocommerce/plugins/woocommerce/client/blocks/assets/js/data/checkout/push-changes.ts`

What it understood:

- `woocommerce_register_additional_checkout_field()` defers until blocks load,
  resolves `CheckoutFields`, and calls `register_checkout_field()`.
- Fields are grouped by `address`, `contact`, and `order`; core fields are
  exposed through asset data as `defaultFields` and location keys.
- Client constants consume those locations into `ADDRESS_FORM_KEYS`,
  `CONTACT_FORM_KEYS`, and `ORDER_FORM_KEYS`.
- Contact and order-location fields render through checkout inner blocks.
- Draft updates collect changed `additionalFields`, skip fields with validation
  errors, and PUT `/wc/store/v1/checkout`.
- Server route validation runs `Checkout::validate_callback()` across shipping,
  billing, contact, and order contexts.
- Field callbacks and hooks run through `validate_field()` and
  `validate_fields_for_location()`.
- Schema-based conditional required/hidden/validation rules use
  `Validation::validate_document_object()`.
- POST and PATCH persist additional fields through `CheckoutTrait` to order,
  customer, or session paths.

Likely misses:

- Generic `Form` component internals.
- Client schema-parser implementation.
- Documentation and tests beyond CE-surfaced production files.

Assessment:

The CE-assisted run was valid and disciplined: it avoided broad source search
and used CE to drive source discovery. It also surfaced a slightly deeper
validation/persistence chain than the baseline, especially
`CheckoutFieldsSchema/Validation.php`, location key constants, and draft update
behavior.

It was not faster. It used many CE requests, including no-hit searches and one
locked-DB failure. In its current form, CE helped constrain discovery but did
not make the agent more efficient on this task.

## Quality Scoring

| Dimension | Baseline | CE-assisted | Notes |
| --- | --- | --- | --- |
| Speed | 5/5 | 2/5 | Baseline reached context-ready in less than half the CE time. |
| Request efficiency | 4/5 | 2/5 | Baseline used 9 broad lookups; CE used 32 MCP requests. |
| Source coverage | 4/5 | 4/5 | Both found the main PHP and TS paths. CE found a few deeper validation files. |
| Relationship accuracy | 4/5 | 4/5 | Both traced registration, rendering, API validation, and persistence. |
| Constraint discipline | 2/5 | 5/5 | Baseline relied on broad search; CE avoided broad fallback. |
| Plan quality | 4/5 | 4/5 | Both produced actionable implementation guidance. |

## Conclusion

This run does not yet demonstrate that CE makes the agent faster or reduces
total requests on the checkout field validation task.

It does demonstrate that, after fixing CE graph mounting for MCP search, an
agent can use CE as the primary source-understanding surface and avoid broad
filesystem discovery entirely. CE also improved discipline and slightly improved
depth on validation/persistence details.

For this demo to be compelling, the next CE work should reduce MCP search
friction:

- fewer no-hit searches
- richer search results with paths and line hints
- direct reference/call/context tools exposed through the harness, not just
  substring search
- avoid locked-DB failures during read-only benchmark use

