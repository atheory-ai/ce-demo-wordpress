# 11 IIR Demo Upgrade Overview

## Purpose

Evolve the `ce` branch from a source-discovery benchmark into a truthful
semantic-development demo. The demo must show the complete observable loop:

```text
change request -> declared intent -> resolved semantic plan -> policy findings
-> implementation recipe + test plan -> observed source semantics
-> verification verdict -> repair plan, when needed
```

The existing baseline benchmark remains valuable. It answers whether Context
Engine improves context acquisition. The upgraded benchmark additionally asks
whether it reduces ambiguity before implementation and can verify the semantics
of a bounded change.

## Honesty constraints

- `main` remains source-only. It contains shared specs and baseline materials,
  but no CE configuration, generated artifacts, skills, or semantic snapshots.
- `ce` may only claim capabilities that ship in the exact CE binary and plugin
  bundle recorded for a run.
- A `partial` or `unsupported` source lift produces an `inconclusive` required
  verification result. It is never presented as a semantic pass.
- The initial public renderer is TypeScript-only. Do not claim PHP generation
  or PHPUnit test generation before those renderers exist.
- Demo evidence is immutable and versioned: source submodule SHAs, CE commit,
  plugin artifact hashes, rules/policy identifiers, model identity, and plan
  revision ID are recorded with every run.

## Work packages

| Spec | Deliverable | Dependency |
| --- | --- | --- |
| 12 | Accurate CE-branch contract and setup | none |
| 13 | Stable semantic demo surface | CE semantic workflow APIs |
| 14 | Modeled TypeScript IIR pilot | 12, 13 |
| 15 | Paired semantic benchmark corpus and scoring | 14 |
| 16 | Semantic Studio walkthrough | 13, 15 |
| 17 | PHP + WordPress/WooCommerce semantic capability | 12, 13 |
| 18 | Optional Skillex procedural layer | 12, 15 |
| 19 | Delivery gates and phased rollout | all preceding specs |

## First acceptance target

Task 04, REST API and Gutenberg editor data flow, is the first IIR target. Its
bounded TypeScript client-side unit is suitable for modeled lifting and
verification. WordPress PHP remains a cited/resolved boundary in this pilot,
not a verified semantic implementation.

## Non-goals

- Whole-program semantic equivalence.
- A claim that one benchmark result proves general model superiority.
- Replacing source citations with semantic artifacts.
- Adding a WordPress runtime application or database requirement.

