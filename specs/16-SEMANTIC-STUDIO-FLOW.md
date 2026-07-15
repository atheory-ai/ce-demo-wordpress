# 16 Semantic Studio Flow

## Goal

Make the semantic artifacts understandable to a human observer. Activated graph
nodes remain useful context, but they are not the main IIR story.

## Required walkthrough

1. Open the indexed WordPress ecosystem project and the selected semantic unit.
2. Show the declared intent and distinguish declared from inferred facts.
3. Show resolution bindings, source evidence, confidence, and open questions.
4. Show policy obligations/findings and any approval boundary.
5. Show the implementation recipe and derived test plan.
6. Show the observed source lift beside expected semantics.
7. Show the verification verdict and, for a negative fixture, the repair plan.
8. Show plan revision history and semantic diff after a repair.

## Visual requirements

- Every semantic claim links to its source evidence or clearly says why it is
  unresolved.
- `partial`, `unsupported`, and `inconclusive` are visually distinct from
  verified success.
- The screen can explain why a policy obligation exists and which pass added it.
- The flow can be recorded from checked-in fixtures without a model call.

## Acceptance criteria

- A presenter can demonstrate positive, negative, and inconclusive outcomes in
  under ten minutes.
- A viewer can trace each conclusion back to a plan field and source evidence.

