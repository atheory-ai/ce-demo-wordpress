# 10 Implementation Plan

## Phase 1: Spec And Baseline

- Create this repository.
- Add the spec set.
- Add baseline README.
- Decide initial submodule SHAs for WordPress, Gutenberg, and WooCommerce.
- Add submodules to `main`.
- Add baseline demo tasks and prompts.

## Phase 2: Baseline Pilot

- Run one or more agents against `main`.
- Capture lookup actions, time, token estimates, and answer quality.
- Refine scenarios until they are hard but evaluable.
- Commit baseline notes without overstating results.

## Phase 3: CE Branch

- Create `ce` branch from `main`.
- Add CE config and scripts.
- Add Skillex config and skills.
- Add scripted CE queries.
- Add Studio flow.
- Run the same scenarios against CE.

## Phase 4: Paired Benchmark

- Run paired baseline and CE-assisted tasks.
- Produce context-acquisition reports.
- Produce end-to-end task reports.
- Compare source coverage, relationship accuracy, token use, lookup actions, and
  missed context.

## Phase 5: Publishable Demo

- Add polished README instructions.
- Add release/compatibility notes for CE, SDK, Studio, and Skillex versions.
- Add short demo script for presentations.
- Decide whether to add optional extra plugin source repos.

## Open Questions

- Which exact upstream commits should be pinned for the first run?
- Should PHP parsing be supported in CE before the flagship demo, or should the
  first version focus on JavaScript/TypeScript plus file/text relationships?
- Which token accounting source will be used for agent runs?
- Should benchmark prompts require sub-agents for impartial comparison?
- How much of the Studio flow should be scripted versus presenter-driven?
