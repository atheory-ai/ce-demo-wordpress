# 04 Baseline Main Branch

## Purpose

`main` is the control group. It should let someone test how a capable agent
behaves with a large source tree and ordinary repository documentation, but
without CE.

## Contents

The branch should contain:

- root README
- source submodules
- task prompts
- baseline benchmark instructions
- expected failure mode notes
- no CE or Skillex augmentation

Recommended structure:

```text
atheory-ce-demo-wordpress/
  README.md
  .gitmodules
  wordpress/
  gutenberg/
  woocommerce/
  demo/
    tasks/
    prompts/
    baseline-notes.md
  specs/
```

## Baseline Agent Instructions

Baseline tasks should instruct the agent to use normal repository exploration:

- read docs
- inspect source
- use search tools
- produce cited findings
- track files read and commands run
- estimate tokens used where possible

The baseline must not use:

- CE queries
- CE-generated context reports
- Studio
- Skillex skills
- prebuilt answer keys

## Expected Baseline Behavior

The baseline should be good enough to be credible. It should not be a strawman.

Expected weaknesses:

- broad search loops
- missed dynamic hook/filter relationships
- over-reliance on prior WordPress knowledge
- incomplete cross-repo tracing
- plausible but uncited architecture claims
- high token use from reading large files and repeated search output

## Deliverables

A baseline run should produce:

- answer or implementation plan
- files/commands inspected
- time to context-ready
- time to final answer
- approximate token use if the runner exposes it
- confidence level
- known gaps
