# Task 05: Block Serialization Regression

Investigate a regression where saved block markup changes unexpectedly after an
editor update.

## Scenario

A developer sees a diff in saved post content after opening and saving a post in
the editor. The task is to find serialization, parsing, validation, and backward
compatibility logic that could explain the change.

## Expected Investigation

- Locate block serialization and parsing logic.
- Identify validation paths for saved markup.
- Find compatibility or deprecation handling.
- Explain which tests would catch the regression.

## Evaluation Questions

- Which package serializes block attributes and markup?
- Which code validates saved content against block definitions?
- Where are deprecated block versions handled?
- Which fixtures or tests should be inspected first?
