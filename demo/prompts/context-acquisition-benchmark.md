# Context Acquisition Benchmark Prompt

Run the assigned task as a context-acquisition benchmark.

Stop after you can explain the relevant control flow and extension points well
enough to propose a grounded implementation plan. Do not implement the change.

Report:

- the first five lookup commands you chose
- the files that changed your understanding
- the minimum source set another agent would need
- the relationships between WordPress, Gutenberg, and WooCommerce code
- the remaining unknowns

This prompt is intentionally used on the no-CE branch first. The same task can
later be run on the `ce` branch to compare context retrieval quality.
