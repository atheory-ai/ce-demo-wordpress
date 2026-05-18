# Atheory CE Demo: WordPress Ecosystem

This repository is a source-understanding demo for Context Engine.

The demo uses a large WordPress ecosystem code constellation to show how AI
agents behave when they must reason across unfamiliar, multi-language,
extension-heavy software. The intended source set is WordPress core, Gutenberg,
WooCommerce, and optional additional plugin repositories when a demo scenario
needs more domain complexity.

This `main` branch is the baseline branch. It represents the large project
without Context Engine configuration. The future `ce` branch will contain the
same source constellation plus CE config, repeatable indexing fixtures, scripted
queries, Studio walkthroughs, and Skillex skills.

## What This Demo Should Prove

The demo is not just about better explanations. It should demonstrate that CE can
help agents:

- reach useful context faster
- use fewer lookup commands and fewer tokens to become context-ready
- maintain more accurate knowledge across large, indirect code paths
- trace relationships across PHP, TypeScript, React, REST APIs, hooks, filters,
  block registration, and commerce flows
- produce more grounded implementation plans with fewer missed extension points

## Branch Model

| Branch | Purpose |
| --- | --- |
| `main` | Source-only baseline. No CE config, no CE fixtures, no Skillex augmentation. |
| `ce` | CE-equipped branch with indexing config, scripted queries, Studio flow, and Skillex skills. |

The branch comparison is the core demo:

1. Run an agent against `main` and measure how much manual discovery it needs.
2. Run the same task against `ce` and measure context quality, lookup effort,
   token use, and answer correctness.

## Current Status

This repo is being built spec-first. Start with the files in [specs](./specs/)
before adding source submodules or CE configuration.

## Spec Index

- [00 README First](./specs/00-README-FIRST.md)
- [01 Project Goals](./specs/01-PROJECT-GOALS.md)
- [02 Branch Contract](./specs/02-BRANCH-CONTRACT.md)
- [03 Source Constellation](./specs/03-SOURCE-CONSTELLATION.md)
- [04 Baseline Main Branch](./specs/04-BASELINE-MAIN-BRANCH.md)
- [05 CE Branch](./specs/05-CE-BRANCH.md)
- [06 Demo Scenarios](./specs/06-DEMO-SCENARIOS.md)
- [07 Measurement Model](./specs/07-MEASUREMENT-MODEL.md)
- [08 Studio Flow](./specs/08-STUDIO-FLOW.md)
- [09 Skillex Integration](./specs/09-SKILLEX-INTEGRATION.md)
- [10 Implementation Plan](./specs/10-IMPLEMENTATION-PLAN.md)
