# Task 02: Checkout Field Validation

Trace where WooCommerce checkout fields are defined, rendered, validated, and
submitted.

## Scenario

A developer needs to add a custom checkout field with validation rules that work
in the modern WooCommerce checkout flow. The task is to find the relevant PHP,
React, Store API, and extension points.

## Expected Investigation

- Identify the modern checkout block flow.
- Locate field rendering and client-side validation code.
- Locate Store API request validation and server-side processing.
- Identify extension points that avoid patching core code.

## Evaluation Questions

- Which source files own checkout field definitions?
- Which code validates submitted checkout data?
- How does the checkout block communicate with server APIs?
- What is the safest extension mechanism?
