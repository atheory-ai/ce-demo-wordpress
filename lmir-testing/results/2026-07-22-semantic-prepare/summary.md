# Semantic-preparation smoke test — 2026-07-22

## Question

Does the development-path model call shape a PHP request into a validated,
source-free implementation packet and preserve unresolved decisions instead of
inventing code?

## Method

One bounded `gpt-5.6-luna` medium-reasoning call ran:

```sh
ce iir prepare "Validate a WooCommerce checkout key..." \
  --target CheckoutValidator.validate_key \
  --language php \
  --context woocommerce.checkout
```

The raw JSON, stderr, and exit code are retained beside this file. No source,
index, or database was written.

## Result

- Exit code: `0`.
- Candidate IIR language: `php`; function: `validateCheckoutKey`.
- The candidate preserved the no-side-effects-before-validation constraint and
  failure tag, and supplied a normalized empty-key condition.
- The model left return type, visibility, success behavior, and post-success
  side effects as explicit open questions.
- Packet status: `blocked`. It correctly instructed an implementation agent not
  to write source until those questions are answered.

## Important integration boundary

The packet has no WordPress obligations in this run. This is expected for the
currently installed demo WASM artifact: it was built with the prior published
plugin SDK and therefore does not yet contain the newly declared
`semanticPolicies` manifest field. The plugin source now declares its narrowly
scoped checkout policies, but the artifact must be rebuilt after publishing the
updated SDK before a full demo policy-integration claim can be made.

This run therefore validates NL → candidate IIR → question-preserving packet
behavior, not WordPress policy decoration. The CE unit tests cover host parsing,
language selection, provenance, conflict blocking, and packet construction for
the new policy wire contract.
