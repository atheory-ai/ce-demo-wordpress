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
discovery as the way to learn the source tree.

- Start from a fresh agent with no context copied from a baseline run.
- Give the agent only this repo path and one task from `demo/tasks/`.
- Use CE queries and CE source references before inspecting source files.
- Use `rg`, `find`, `ls`, and broad file reads only to diagnose CE setup
  failure, not to perform the investigation.
- After CE cites a specific file, narrowly read the cited file or nearby range
  only to verify exact implementation details.
- If CE indexes zero files, cannot load language plugins, cannot query the
  indexed graph, or cannot produce useful source references, stop and report a
  CE release blocker.

Recommended local commands:

```bash
ce --config ./ce.yaml index . --full \
  --exclude '**/.git/**' \
  --exclude '**/node_modules/**' \
  --exclude '**/vendor/**' \
  --exclude '**/build/**' \
  --exclude '**/dist/**'

ce --config ./ce.yaml query "Investigate the selected benchmark task and cite the relevant source paths."
```

When using a local development binary, replace `ce` with the explicit binary
path and pass the same `--config ./ce.yaml` and `--data-dir` values for both
`index` and `query`.

## Measurement

Record:
- one-time CE indexing cost
- CE query count
- repeated CE query latency
- narrow verification reads performed after CE citations
- any broad lookup commands used only for CE failure diagnosis
- files cited
- relationships found across WordPress, Gutenberg, and WooCommerce
- missed expected context
- unsupported claims
- final plan quality

Do not claim a CE improvement unless a paired baseline run on the same source
commit shows a measurable difference in context acquisition time, lookup
volume, relationship accuracy, source coverage, missed context, or plan quality.
