# 07 Measurement Model

The demo must measure more than answer preference.

## Primary Measures

| Measure | Description |
| --- | --- |
| Context-ready time | Time until the agent has enough grounded context to propose a plan. |
| Lookup actions | Count of search commands, file reads, directory listings, and repeated exploratory loops. |
| Token use | Approximate prompt/input/output tokens consumed before context-ready and final answer. |
| Source coverage | Whether the answer identifies the expected repos, files, APIs, hooks, and extension points. |
| Relationship accuracy | Whether the answer correctly connects source areas rather than listing isolated files. |
| Missed critical context | Important files, hooks, APIs, or constraints omitted from the answer. |
| Hallucination rate | Claims about APIs, files, or behavior not supported by source. |
| Plan quality | Whether the resulting plan is safe, scoped, testable, and compatibility-aware. |

## Secondary Measures

- wall-clock time to final answer
- number of times the agent changes direction
- size of search output read into context
- number of files read but not used in final reasoning
- confidence calibration

## CE-Specific Measures

On the `ce` branch, separate:

- one-time indexing cost
- repeated query latency
- task execution time after index exists
- CE query count
- Studio inspection time
- token savings from targeted context retrieval

This distinction matters because indexing is an upfront investment while the
demo should show repeated task improvement over the same large codebase.

## Benchmark Modes

### Context Acquisition

Stop when the agent can state:

- relevant source areas
- expected relationships
- likely files to inspect next
- confidence and gaps

This mode isolates context quality and lookup cost.

### End-To-End Task

Continue until the agent produces:

- final answer or implementation plan
- cited evidence
- test plan
- uncertainty list

This mode is more realistic but noisier.

## Reporting Format

Every run should produce a small report:

```text
branch:
scenario:
agent/model:
started_at:
context_ready_at:
finished_at:
lookup_actions:
estimated_input_tokens:
estimated_output_tokens:
files_cited:
relationships_found:
missed_expected_context:
unsupported_claims:
summary:
```

The first benchmark should be honest and small. Three paired runs per scenario
is enough for a pilot report.
