# 00 README First

This repository is the flagship high-complexity demo for Context Engine.

The demo should feel like a real agent dropped into a large codebase it partly
recognizes but cannot fully hold in context. WordPress is familiar enough that
many developers and models have some prior knowledge, but the real source
constellation is large, dynamic, and cross-cutting enough that prior knowledge
and grep alone are not reliable.

## Core Idea

Use a source-only WordPress ecosystem repository as the baseline, then create a
separate `ce` branch that adds Context Engine and Skillex augmentation.

The branch comparison should answer:

- How much work does an agent do to become context-ready without CE?
- How accurate is the context it reconstructs manually?
- How many important relationships does it miss?
- How much faster and cheaper can it become context-ready with CE?
- Does CE improve knowledge quality, not just response speed?

## Non-Goals

- Do not build a production WordPress site for the first version.
- Do not require a local database, web server, PHP runtime, or browser just to
  evaluate source understanding.
- Do not copy large upstream source trees into this repo when submodules can pin
  exact upstream commits.
- Do not make the first demo depend on unpublished CE installation flows.

## First Version Shape

The first version should contain:

- pinned source repositories as submodules
- baseline README and demo instructions on `main`
- repeatable agent tasks
- measurement rubric for time, lookup effort, token use, and correctness
- no CE config on `main`

The `ce` branch should later add:

- `ce.yaml`
- indexing scripts
- query scripts
- expected context reports
- Studio walkthrough
- Skillex skills
- CE-specific benchmark instructions
