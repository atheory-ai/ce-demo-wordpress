# Baseline Demo

This directory defines the no-CE control run for the WordPress ecosystem demo.

Use this branch to measure how much discovery work an agent needs when it only
has the source tree and ordinary shell tools. Do not add CE configuration,
generated indexes, Studio walkthroughs, Skillex skills, or precomputed answers
to this branch.

## Setup

Clone the repository with submodules:

```sh
git clone --recurse-submodules git@github.com:atheory-ai/ce-demo-wordpress.git
```

If the repository was already cloned:

```sh
git submodule update --init --recursive
```

## Running A Baseline Session

1. Pick one task from [tasks](./tasks/).
2. Start with [prompts/baseline-agent-prompt.md](./prompts/baseline-agent-prompt.md).
3. Ask the agent to solve the task using only this branch.
4. Record measurements using [report-template.md](./report-template.md).
5. Summarize observations in [baseline-notes.md](./baseline-notes.md).

The most important measurements are context-ready time, lookup actions, token
use, source coverage, relationship accuracy, missed critical context, and
whether the final answer cites the correct files.
