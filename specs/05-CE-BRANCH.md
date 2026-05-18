# 05 CE Branch

## Purpose

The `ce` branch demonstrates the same tasks with CE and Skillex augmentation.

It should make the difference visible without hiding the mechanism. Users should
be able to see what was indexed, what queries were run, what Studio shows, and
which Skillex skills were available.

## Expected Contents

```text
ce.yaml
demo/
  queries/
  expected/
  studio-flow.md
  benchmark.md
scripts/
  ce-index.sh
  ce-query.sh
  ce-reset.sh
skillex.yaml
skillex/
  public/
  private/
```

## CE Configuration

The CE config should:

- index all source submodules
- exclude generated directories, dependency installs, caches, and vendor build
  outputs
- declare the default plugins needed for PHP, TypeScript/JavaScript, JSON, and
  Markdown as they become available
- keep local data under a demo-specific path so runs are resettable

The first CE branch may reference unpublished local CE binaries while CE is not
published. Once CE is published, the branch should move to documented install
commands.

## Scripted Queries

Queries should be checked into `demo/queries/` as plain text or markdown files.
Each query should map to:

- scenario
- expected useful anchors
- expected source areas
- expected answer qualities
- known hard parts

## Studio Flow

The Studio walkthrough should show:

- opening the indexed project
- running a query
- inspecting activated nodes
- following graph relationships
- opening a trace
- comparing CE output to the baseline run

## Skillex Role

Skillex should augment procedure and domain behavior, while CE supplies indexed
source knowledge.

Examples:

- WordPress hook/filter reasoning process
- Gutenberg block registration checklist
- WooCommerce checkout/order lifecycle checklist
- benchmark reporting rubric

Skillex should not duplicate large source facts that CE can retrieve.
