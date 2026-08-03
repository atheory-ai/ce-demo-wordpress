# CE WordPress Demo Agent Guide

This branch is the Context Engine assisted benchmark branch for the WordPress
demo repository. Use CE to understand the codebase.

## Source Layout
- `wordpress/` - WordPress core submodule
- `gutenberg/` - Gutenberg submodule
- `woocommerce/` - WooCommerce submodule
- `demo/tasks/` - benchmark tasks
- `demo/report-template.md` - run report template
- `specs/` - benchmark design notes
- CE's embedded `com.atheory-ai.php` provider - certified structural PHP facts
- `plugins/wordpress-conventions/` - additive WordPress framework facts

Do not require a running WordPress site, database, browser, PHP server, or Node
dev server unless a task explicitly asks for runtime validation. The primary
benchmark is source understanding.

## Required CE Workflow

Use Context Engine for codebase understanding. Do not use broad filesystem
discovery as the way to learn the source tree. Run CE from this repository root
so project detection, config loading, and relative paths all refer to the demo
project. For a **CE + Skillex** comparison, bootstrap the local Skillex registry
once in a fresh clone, then query the relevant skills. Do not load Skillex in a
CE-only comparison.

```bash
scripts/skillex-refresh.sh
skillex query --path AGENTS.md --format content
```

- Start from a fresh agent with no context copied from a baseline run.
- Give the agent only this repo path and one task from `demo/tasks/`.
- Start the CE-assisted condition with `demo/prompts/ce-agent-prompt.md`; use
  its optional Skillex mode only when the comparison explicitly calls for it.
- Use the CE harness/integration, graph/source tools, references, callgraph,
  summaries, concepts, and file-context results for discovery and navigation.
  CE v1 benchmark runs should use deterministic CE tools rather than
  experimental `ce_query`.
- Do not use `rg`, `find`, `ls`, broad shell search, or bulk file reads to
  discover relevant code when CE is available.
- After CE identifies a specific file, symbol, method, reference, call path, or
  source range, narrowly inspect that source. This is allowed and expected; the
  file read must be traceable to a CE result.
- Use source text for detailed reasoning after CE has narrowed the target. AST
  and graph structure are for finding and ranking; exact code is often the best
  evidence for conditionals, hooks, ordering, comments, and edge cases.
- Use shell search only to diagnose CE setup failure or verify that a CE-cited
  path exists, not to perform the investigation.
- If CE indexes zero files, cannot load language plugins, cannot query the
  indexed graph, or cannot produce useful source references, stop and report a
  CE release blocker.

Recommended local setup:

```bash
cd plugins
pnpm install
pnpm run toolchain:install
pnpm test && pnpm build
```

Run the small fixture before the corpus. It must report one indexed file with a
non-empty graph plus framework semantic entities, occurrences, and
relationships, and no write-buffer warnings:

```bash
mkdir -p /tmp/ce-wordpress-demo-data
/path/to/ce --config ./ce.yaml --data-dir /tmp/ce-wordpress-demo-data \
  index demo/fixtures/php-iir --full
```

The demo uses the published CE plugin SDK for its framework plugins. PHP and
its pinned grammar are built, certified, and shipped by CE itself; the demo
declares that provider as a dependency and does not rebuild or override it.

## Capability Boundaries

- Structural PHP plus WordPress/WooCommerce convention facts are available
  after the demo plugins build.
- PHP facts are source-navigation evidence. Do not call them modeled IIR
  verification until the PHP plugin emits grounded v1 IIR claims and coverage.
- `demo/iir/` demonstrates the shipped TypeScript intent/generate/test/verify
  loop. It is a bounded semantic exercise connected to Task 04, not a claim
  that Gutenberg's PHP/TypeScript flow is fully verified.

<!-- skillex:start -->
## Skillex

This project uses Skillex for skill management. Use the skillex MCP server
if available (preferred), otherwise use the CLI commands below.

### MCP (preferred)

If the `skillex` MCP server is connected, use it directly:

- Use the `skillex_query` tool with parameters: path, topic, tags, package, search, format.
- Use `search` for intent-based discovery — pass space/comma-separated concepts to find relevant skills without knowing the taxonomy.
- Browse available skills through MCP resource discovery.

### CLI (fallback)

If MCP is not available, query skills via the command line:

```
  skillex query --search "<concepts>"
  skillex query --path <filepath>
  skillex query --topic <topic> --tags <tags>
  skillex query --package <package>
  skillex query --path <glob> --topic <topic> --format content
```

### Available scopes

  - **
  - demo/iir/**
  - plugins/**

### Available topics

  benchmark, context-acquisition, context-engine, demo-architecture, framework-analysis, gutenberg, iir, php, plugin-authoring, semantic-graphs, semantic-verification, static-analysis, typescript, wasm, woocommerce, wordpress

### Available tags

  blocks, callbacks, ce, completeness, coverage, cst, evidence, guided-learning, hooks, iir, intent, lifecycle, policy, repair, rest-api, sandbox, sdk, source-evidence, tree-sitter, wasm, wordpress

<!-- skillex:end -->

## Measurement

Record telemetry:
- one-time CE indexing cost
- CE tool request count
- repeated CE tool latency
- narrow verification reads performed after CE citations
- any broad lookup commands used only for CE failure diagnosis
- files cited
- relationships found across WordPress, Gutenberg, and WooCommerce
- unsupported claims

Primary scoring is correctness:
- subtle or major facts CE found that the baseline missed
- subtle or major facts the baseline found that CE missed
- false causal explanations avoided by either run
- important source relationships recovered by either run
- critical files, symbols, hooks, or tests missed by either run
- final answer depth, accuracy, and safe implementation quality

Do not claim a CE improvement unless a paired baseline run on the same source
commit shows a measurable difference in correctness, depth, relationship
accuracy, source coverage, missed context, or plan quality. Time and request
count are useful diagnostics, but do not outweigh correctness unless the CE path
is so slow or noisy that the task becomes impractical.
