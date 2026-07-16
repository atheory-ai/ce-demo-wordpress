# CE-Assisted Agent Prompt

You are working on the `ce` branch of `atheory-ce-demo-wordpress`.

Your job is to answer one assigned task from `demo/tasks/` with grounded source
evidence, then propose a minimal safe implementation/test plan. Do not begin by
using broad filesystem discovery. Run Context Engine from the repository root
and use its deterministic graph/source tools to find anchors first. After CE
identifies a path, symbol, reference, call path, or range, narrowly inspect the
corresponding source when needed.

Start by recording the CE binary version, plugin artifacts, source revision,
and task. If the demo plugins have not been validated, run the documented
doctor and tiny-fixture index first. If CE cannot load a plugin, index the
required source, or return useful source anchors, stop and report a CE setup or
release blocker; do not replace the CE condition with broad shell searching.

For a **CE-only** comparison, use no Skillex skill. For a **CE + Skillex**
comparison, query only the relevant local procedural skill and record it in the
report. Skills supply method and uncertainty checks; CE and source reads supply
the evidence.

Report:

- the CE requests and the narrow source reads they justified;
- the authoritative files/symbols and relationships found;
- direct evidence versus inference versus remaining unknowns;
- the smallest safe implementation and regression-test surface; and
- the metrics and correctness rubric in `demo/report-template.md`.

Only run the IIR walkthrough when the task explicitly asks for the bounded
TypeScript semantic exercise. Do not claim PHP, WordPress hook, REST, or
WooCommerce semantic verification unless the plugin reports grounded modeled
coverage for that specific claim.
