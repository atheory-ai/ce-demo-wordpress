---
name: Building Framework Intelligence Plugins
description: Build CE plugins that make framework runtime conventions and hidden control flow deterministically navigable without relying on agent prior knowledge.
topics: [plugin-authoring, framework-analysis, semantic-graphs, static-analysis]
tags: [ce, wasm, cst, callbacks, lifecycle, completeness]
---

# Building Framework Intelligence Plugins

A framework plugin is an executable semantic model, not documentation for the
agent. Encode the framework's hidden behavior as source-grounded entities,
occurrences, relationships, outcomes, and coverage so an agent unfamiliar with
the framework can discover how the application really executes through normal
CE investigation.

## Authoring workflow

1. Depend on the language plugin and any lower framework layer. Keep syntax in
   the language plugin and framework meaning in the framework plugin.
2. Inventory each implicit mechanism: registration, dispatch, removal,
   inspection, ordering, lifecycle, routing, middleware, dependency injection,
   jobs, configuration, templates, persistence, generated names, and extension
   points.
3. Define stable canonical entities for runtime identities and exact source
   occurrences for every observation. Never put source offsets in entity keys.
4. Connect occurrences to their enclosing structural callable with
   `declared_in` whenever the CST proves ownership.
5. Emit callback and handler relationships with one of `resolved`, `ambiguous`,
   `external`, `unresolved`, `dynamic`, or `unsupported`. Preserve expressions
   and candidates; do not guess.
6. Preserve direct calls separately from framework-mediated execution. Provide
   registration and dispatch evidence so CE can materialize framework entrypoint
   and event paths after all file contributions are published.
7. Emit per-file coverage for every declared capability, including
   `not_applicable` and `unavailable`. “No fact” must never imply “fully checked.”
8. Ensure ordinary callgraph, symbol-context, entrypoint, and investigation
   queries reveal the framework facts. A special tool the agent must remember is
   insufficient.

## Completeness matrix

For every framework mechanism, test:

- literal, qualified, object/static method, callable-array, closure, variable,
  generated-name, ambiguous, external, and unsupported forms as applicable;
- registration, invocation, removal, inspection, priority/order, and lifecycle;
- same-file and cross-file callbacks;
- changed, moved, and deleted evidence replacement;
- endpoint integrity, deterministic reindex, targeted refresh, and coverage;
- one corpus question whose answer requires the hidden framework path.

Use CST structure as the evidence boundary. Narrow token normalization inside a
CST-identified expression is acceptable; regex scanning of source text as a
substitute for parsing is not.

## Stop condition

Do not call a framework capability complete because common examples work. Ship
it as partial until its declared matrix, dynamic outcomes, replacement behavior,
and ordinary-query surfacing are all tested. Document genuine runtime-only
boundaries instead of encoding framework lore as fact.
