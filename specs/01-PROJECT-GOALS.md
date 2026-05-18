# 01 Project Goals

## Purpose

Create a realistic benchmark and sales demo for CE-assisted AI agent work at the
complex end of software development.

The demo should show a sharp contrast between:

- agents reconstructing context manually with shell search, file reads, and
  prior knowledge
- agents using CE to query an indexed, relationship-aware model of the same
  source constellation

## Qualities

The repository should be:

- **Large**: big enough that exhaustive reading is impossible in normal agent
  context windows.
- **Familiar but not obvious**: many agents know WordPress concepts, but still
  need source-grounded context for real changes.
- **Multi-language**: PHP, JavaScript, TypeScript, React, JSON, build metadata,
  and docs.
- **Cross-boundary**: behavior should span WordPress core, Gutenberg,
  WooCommerce, REST APIs, hooks, filters, packages, and UI code.
- **Dynamic**: hooks, filters, callbacks, block registration, service containers,
  and extension points should make plain text search incomplete.
- **Repeatable**: demo tasks and measurements should be runnable by different
  agents with comparable outputs.
- **Honest**: results should capture where CE helps, where it does not yet help,
  and what requires Skillex or human review.

## Demonstration Claims

The demo should support these claims with repeatable evidence:

1. CE improves context quality.
2. CE reduces the number of manual lookup actions needed to reach a useful plan.
3. CE can reduce token spend by replacing broad file-reading with targeted
   graph-backed retrieval.
4. CE helps agents preserve relationships that are easy to lose across large
   codebases.
5. CE plus Skillex is stronger than either source search or procedural skills
   alone.

## What Counts As Success

A successful CE-assisted run should:

- identify more relevant source files and extension points
- cite better grounded relationships between subsystems
- produce a safer implementation or investigation plan
- avoid obvious hallucinated APIs
- require fewer broad `find`, `grep`, `rg`, and file-dump loops
- reach context-ready state with fewer tokens

Wall-clock time matters, but it is secondary to context quality and token
efficiency. Some CE runs may spend time indexing up front; the demo should
separate one-time indexing cost from repeated query and task execution cost.
