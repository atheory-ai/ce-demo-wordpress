# 02 Branch Contract

## Branches

The repository uses two primary branches:

| Branch | Contract |
| --- | --- |
| `main` | Source-only baseline for agent comparison. |
| `ce` | CE-equipped version of the same source constellation. |

## `main`

The `main` branch must remain free of CE-specific files.

Allowed on `main`:

- upstream source submodules
- baseline README
- demo task specs
- benchmark prompts
- expected baseline failure modes
- general documentation explaining the comparison

Not allowed on `main`:

- `ce.yaml`
- CE-generated databases or indexes
- CE query scripts
- Studio walkthrough files that assume CE is enabled
- Skillex config or skills

## `ce`

The `ce` branch starts from `main` and adds CE and Skillex material.

Expected additions:

- `ce.yaml`
- `demo/queries/`
- `demo/expected/`
- `demo/studio-flow.md`
- `scripts/ce-index.sh`
- `scripts/ce-query.sh`
- `scripts/ce-reset.sh`
- `skillex.yaml`
- `skillex/public/`
- `skillex/private/`

The `ce` branch must keep source submodule SHAs aligned with `main` unless the
demo explicitly compares different source versions.

## Comparison Rule

Tasks must be runnable from both branches with the same natural-language prompt.
The only difference should be the available augmentation:

- `main`: source tree and baseline docs only
- `ce`: source tree plus CE index, Studio flow, scripted queries, and Skillex
  skills
