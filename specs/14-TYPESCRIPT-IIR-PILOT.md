# 14 TypeScript IIR Pilot

## Goal

Deliver the first end-to-end, semantically verified demo slice using the
Gutenberg client side of Task 04: REST API and editor data flow.

## Scope

Choose one bounded TypeScript operation in a Gutenberg data-store/resolver/cache
path. The fixture must have:

- a named semantic unit and source anchor;
- a request/input contract;
- one or more observable state/cache effects;
- a failure or invalidation condition;
- a small, source-backed change request; and
- a target test surface.

PHP REST controllers are allowed as resolved source boundaries and evidence,
but are outside the pilot's required semantic verification coverage.

## Plugin work

The TypeScript language plugin must emit v1 modeled source-lift output for the
selected constructs:

- observed `FunctionIntent`;
- claims for modeled effects/failures;
- source spans and classifier basis; and
- `modeled` coverage only where the plugin can justify it.

Unmodeled syntax must remain `partial` or `unsupported`; do not inflate
coverage to make the demonstration pass.

## Demo artifacts

For one positive, one negative, and one inconclusive fixture, check in:

- declared intent;
- expected bindings and open questions;
- expected policy findings;
- expected recipe/test-plan summary;
- observed-lift expectation;
- verification verdict; and
- repair expectation for the negative case.

## Acceptance criteria

- Positive fixture: required modeled claims verify as `passed`.
- Negative fixture: verification fails with evidence-backed repair targets.
- Inconclusive fixture: missing lift coverage remains visible and cannot pass.
- The same artifacts can be regenerated and compared in CI without an LLM.

