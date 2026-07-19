---
name: CE Guided WordPress Investigation
description: Investigate WordPress ecosystem behavior through CE before narrow source verification.
topics: [context-acquisition, wordpress, gutenberg, woocommerce]
tags: [hooks, rest-api, blocks, source-evidence]
---

# CE Guided WordPress Investigation

Use this skill for source-understanding tasks on the CE branch.

## Procedure

1. Read the selected task under `demo/tasks/` and state the question in terms
   of behavior, boundary, and expected decision.
2. Use CE status/search/concepts/entrypoints to find anchors. For behavior that
   crosses repositories, use references, callgraph, and file context before
   guessing from framework familiarity.
3. Make narrow source reads only after CE returns a file, symbol, reference,
   call path, or range.
4. Separate direct source evidence from a plausible but unresolved lifecycle,
   hook order, authentication, cache, or runtime condition.
5. Produce a minimal implementation/test plan and cite the source evidence for
   each material claim.

## Domain checks

- For hooks and filters: distinguish registration, invocation, callback, and
  priority. Do not infer execution order from a name match.
- For REST/editor questions: trace controller/route → client request → data
  store/resolver → cache or invalidation → consumer.
- For WooCommerce: distinguish Store API behavior from broader order, session,
  and payment semantics.

## Stop conditions

Stop and report a setup/release blocker if CE cannot load the demo plugins,
indexes zero files, cannot index the required source, cannot query the indexed
graph, or cannot cite usable source anchors. Do not silently fall back to broad
filesystem discovery or claim a CE-assisted result from an empty or unusable
index.
