# Baseline Report Template

## Run Metadata

- Date:
- Agent:
- Model:
- Task:
- Branch:
- Commit:
- Operator:

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

## Notes

- What did the agent search for first?
- Where did it get stuck?
- Which cross-repository relationship was hardest to recover?
- Which files or APIs should the CE branch surface faster?
- For CE-assisted runs, were all manual source reads traceable to CE-cited
  files, symbols, methods, references, call paths, or source ranges?
