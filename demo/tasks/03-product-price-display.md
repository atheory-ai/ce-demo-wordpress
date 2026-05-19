# Task 03: Product Price Display

Trace how WooCommerce product price data is calculated, formatted, exposed to
blocks, and displayed.

## Scenario

A developer needs to explain why a custom product price appears correctly in
classic templates but not in a block-based product surface. The task is to map
the classic PHP path and the block/editor path.

## Expected Investigation

- Locate product price calculation and formatting APIs.
- Identify block code that consumes product price data.
- Trace REST or Store API payloads involved in block rendering.
- Identify filters or extension points that affect one path but not the other.

## Evaluation Questions

- Which PHP methods are authoritative for product prices?
- Which block packages render or fetch price data?
- Where can the classic and block paths diverge?
- Which extension points should be tested?
