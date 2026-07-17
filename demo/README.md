# CE Demo Operations

This directory holds the shared task corpus and the CE-branch operating
instructions for the WordPress ecosystem demo.

## Choose A Condition

| Condition | Branch | Prompt | Allowed aids |
| --- | --- | --- | --- |
| Baseline | `main` | [baseline-agent-prompt.md](./prompts/baseline-agent-prompt.md) | Ordinary local source inspection only. |
| CE | `ce` | [ce-agent-prompt.md](./prompts/ce-agent-prompt.md) | CE graph/source evidence; no Skillex skill. |
| CE + Skillex | `ce` | [ce-agent-prompt.md](./prompts/ce-agent-prompt.md) | CE evidence plus the recorded relevant procedural skill. |

The task, source revisions, model, and report template must be the same across
conditions. Keep baseline results honest: the goal is a fair context-quality
comparison, not a predetermined winner.

## CE Branch Setup

After cloning with submodules, build the demo-owned plugins under `plugins/`,
then run from the repository root:

```sh
CE_BIN=/path/to/current/ce scripts/ce-doctor.sh
CE_BIN=/path/to/current/ce scripts/ce-index.sh --full demo/fixtures/php-iir
```

The demo requires a current CE build that supports the `plugins.installed`
configuration used by `ce.yaml`; a binary labelled only `0.1.0-dev` may be too
old. For CE + Skillex, also run `scripts/skillex-refresh.sh` before the first
skill query.

## Run A Session

1. Pick a task from [tasks](./tasks/).
2. Start a fresh agent with only the repository, selected prompt, and task.
3. Record context evidence, lookup actions, source citations, uncertainty, and
   outcomes in [report-template.md](./report-template.md).
4. Keep IIR work bounded to [iir](./iir/); do not infer full WordPress runtime
   verification from a source-understanding task.
