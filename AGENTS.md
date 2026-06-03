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

Do not require a running WordPress site, database, browser, PHP server, or Node
dev server unless a task explicitly asks for runtime validation. The primary
benchmark is source understanding.

## Required CE Workflow

Use Context Engine for codebase understanding. Do not use broad filesystem
discovery as the way to learn the source tree. Run CE from this repository root
so project detection, config loading, and relative paths all refer to the demo
project.

- Start from a fresh agent with no context copied from a baseline run.
- Give the agent only this repo path and one task from `demo/tasks/`.
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
ce --config ./ce.yaml project init

ce --config ./ce.yaml index . --full \
  --exclude '**/.git/**' \
  --exclude '**/node_modules/**' \
  --exclude '**/vendor/**' \
  --exclude '**/build/**' \
  --exclude '**/dist/**'
```

When using a local development binary, replace `ce` with the explicit binary
path and pass the same `--config ./ce.yaml` and `--data-dir` values for all CE
commands and harness configuration. Local development binaries do not embed
release plugin artifacts, so copy the SDK-built default plugins into the data
directory before indexing:

```bash
mkdir -p "$CE_DATA_DIR/plugins/defaults"
cp /path/to/ce-plugin-sdk/plugins/go-language/dist/go-language.wasm "$CE_DATA_DIR/plugins/defaults/"
cp /path/to/ce-plugin-sdk/plugins/typescript-language/dist/typescript.wasm "$CE_DATA_DIR/plugins/defaults/"
cp /path/to/ce-plugin-sdk/plugins/python-language/dist/python.wasm "$CE_DATA_DIR/plugins/defaults/"
cp /path/to/ce-plugin-sdk/plugins/php-language/dist/php.wasm "$CE_DATA_DIR/plugins/defaults/"
```

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
