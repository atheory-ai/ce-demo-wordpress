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

## Source Constellation

This branch pins the source repositories as git submodules. The dates below are
the upstream commit dates at the time the baseline was created.

| Path | Upstream | Pinned commit | Date | Why it is included |
| --- | --- | --- | --- | --- |
| `wordpress/` | `https://github.com/WordPress/wordpress-develop.git` | `5a96ff4d54a97955b02ac3c20f3ae7f21185232f` | 2026-05-17 | WordPress core APIs, REST controllers, hooks, block server behavior, and tests. |
| `gutenberg/` | `https://github.com/WordPress/gutenberg.git` | `a37545b9299d4dbbd8c3d332f7e109da5a6d5d24` | 2026-05-18 | Editor packages, block registration behavior, React UI, data stores, and serialization logic. |
| `woocommerce/` | `https://github.com/woocommerce/woocommerce.git` | `75675a3fe976ef45d503de4d4c9d2cf5b48a79f1` | 2026-05-18 | Commerce domain flows, checkout blocks, Store API, product data, and extension points. |

## Getting Started

Clone with submodules:

```sh
git clone --recurse-submodules git@github.com:atheory-ai/ce-demo-wordpress.git
```

If you already cloned the repository:

```sh
git submodule update --init --recursive
```

This branch does not require running WordPress, Gutenberg, or WooCommerce. The
first demo is source-understanding only.

## Running The Baseline

Use the materials in [demo](./demo/) to run no-CE control sessions:

1. Pick a task from [demo/tasks](./demo/tasks/).
2. Start with [demo/prompts/baseline-agent-prompt.md](./demo/prompts/baseline-agent-prompt.md).
3. Record context-ready time, lookup actions, files inspected, token estimates,
   and answer quality using [demo/report-template.md](./demo/report-template.md).
4. Summarize publishable observations in [demo/baseline-notes.md](./demo/baseline-notes.md).

The `ce` branch will later add CE config, scripted queries, Studio flows, and
Skillex skills for paired comparisons against these same tasks.

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
- [11 IIR Demo Upgrade Overview](./specs/11-IIR-DEMO-UPGRADE-OVERVIEW.md)
- [12 CE Branch Contract Refresh](./specs/12-CE-BRANCH-CONTRACT-REFRESH.md)
- [13 Semantic Demo Surface](./specs/13-SEMANTIC-DEMO-SURFACE.md)
- [14 TypeScript IIR Pilot](./specs/14-TYPESCRIPT-IIR-PILOT.md)
- [15 Semantic Benchmark Corpus](./specs/15-SEMANTIC-BENCHMARK-CORPUS.md)
- [16 Semantic Studio Flow](./specs/16-SEMANTIC-STUDIO-FLOW.md)
- [17 PHP, WordPress, And WooCommerce Semantics](./specs/17-PHP-WORDPRESS-WOOCOMMERCE-SEMANTICS.md)
- [18 Skillex Demo Layer](./specs/18-SKILLEX-DEMO-LAYER.md)
- [19 IIR Demo Delivery Plan](./specs/19-IIR-DEMO-DELIVERY-PLAN.md)
