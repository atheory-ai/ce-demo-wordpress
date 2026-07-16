# Context Engine Demo Report Template

## Run Metadata

- Date:
- Agent:
- Model:
- Task:
- Branch:
- Commit:
- Operator:
- Condition: `baseline`, `ce`, or `ce-plus-skillex`
- CE binary version and hash: N/A for baseline
- Plugin artifact hashes: N/A for baseline
- Active Skillex skills: none / list
- Source submodule SHAs:

## Measurements

- Context-ready time:
- Lookup actions:
- Broad discovery actions:
- CE requests:
- Narrow CE-cited source reads:
- Approximate prompt/input tokens:
- Approximate output tokens:
- Source files inspected:
- Source files cited in final answer:
- Missed critical files:

## Quality Scoring

| Dimension | Score | Evidence |
| --- | --- | --- |
| Relationship accuracy |  |  |
| Source coverage |  |  |
| Missed critical context |  |  |
| Subtle facts caught |  |  |
| False or shallow causal claims avoided |  |  |
| Hallucination rate |  |  |
| Plan quality |  |  |

## Correctness Delta

Use this section for the main benchmark claim. Time and request count are
telemetry; this is the weighted comparison.

| Finding | Baseline | CE-assisted | Impact |
| --- | --- | --- | --- |
| Major facts caught only by CE |  |  |  |
| Subtle facts caught only by CE |  |  |  |
| Major facts caught only by baseline |  |  |  |
| Subtle facts caught only by baseline |  |  |  |
| Incorrect or unsupported claims |  |  |  |
| Safer final implementation guidance |  |  |  |

## Semantic Artifact Record

Complete this section only for a bounded IIR exercise. `N/A` is the correct
value for context-acquisition-only runs.

- Semantic unit and declared intent path:
- Language and coverage state: `modeled`, `partial`, `unsupported`, or `N/A`
- Declared facts and constraints:
- Resolved source bindings and evidence:
- Open questions:
- Required / forbidden effects and failures:
- Policy or conformance findings, including approvals:
- Generated or selected tests and remaining coverage gaps:
- Verification verdict: `passed`, `failed`, `inconclusive`, or `N/A`
- Repair delta and source targets, if any:

## Notes

- What did the agent search for first?
- Where did it get stuck?
- Which cross-repository relationship was hardest to recover?
- Which files or APIs should the CE branch surface faster?
- For CE-assisted runs, were all manual source reads traceable to CE-cited
  files, symbols, methods, references, call paths, or source ranges?
- Does the reported verdict match the language/plugin coverage boundary rather
  than presenting partial evidence as verified behavior?
