# WordPress and WooCommerce Framework Intelligence Plan

## Goal

Make WordPress and WooCommerce runtime behavior navigable from static evidence
without assuming that the investigating LLM knows either framework. Language
facts remain owned by PHP; WordPress owns its runtime; WooCommerce decorates the
WordPress model through an explicit dependency.

## Architecture

```
PHP structure and direct calls
  -> WordPress registrations, dispatch, routes, lifecycle
    -> WooCommerce commerce conventions and lifecycle
      -> CE project-wide mediated execution projection
        -> ordinary callgraph, semantic context, and investigation
```

Each file extractor runs over the shared PHP CST and merged contribution. It
emits file-scoped evidence only. CE performs the project-wide join after raw
publication and writes the result through the write buffer.

## WordPress capability matrix

| Capability | Occurrences and relationships | Resolution requirements |
|---|---|---|
| Hooks/filters | add/remove, dispatch, inspection, priority, accepted args, lifecycle; `subscribes_with`, `unsubscribes_with`, `dispatches`, `inspects` | literal names canonical; computed names dynamic with pattern |
| REST | route/method identity, handler, permission callback, args | callback outcomes retained independently |
| Shortcodes | registration, removal, inspection, callback | literal tag canonical; generated tag dynamic |
| Cron | scheduled/recurring event, removal, inspection, recurrence and args | hook identity links to the same event graph |
| Blocks | server registration, render callback, asset/settings evidence | metadata paths remain unresolved unless canonical block identity is proven |
| Security boundaries | capability, nonce, validation, sanitization, escaping, response APIs | observations only, never a correctness verdict |

Callback fixtures cover functions, `Class::method`, `$this` arrays, static
arrays, variables, closures, ambiguity, and missing targets. Every occurrence
inside a named callable emits `declared_in`.

## WooCommerce capability matrix

| Capability | Occurrences and relationships |
|---|---|
| Woo hooks | specialize `woocommerce_*` registrations/dispatch and lifecycle family |
| Checkout fields | field identity, location/type, sanitize and validate callbacks |
| Store API extensions | endpoint/namespace identity, data/schema/update callbacks |
| Scheduled actions | Action Scheduler hook, timing, recurrence/cron and group |
| Cart effects | cart API mutations and recalculation boundaries |
| Order lifecycle | persistence, deletion, status transition, payment completion and notes |

WooCommerce depends globally on PHP and WordPress and provides
`framework:woocommerce`; it does not own generic WordPress hook semantics.

## CE materialized views

- `framework_invokes`: framework entity to callback, with producer,
  registration occurrence, relationship, priority, and accepted args.
- `invokes_via_hook`: structural dispatcher to callback through a canonical
  hook, with both supporting occurrences and source files.
- Direct `calls` remain unchanged.
- Rebuild mediated edges on semantic projection completion so targeted refresh
  cannot retain stale paths.

## Delivery sequence and acceptance

1. Extend the normative semantic-module contract and Skillex authoring skill.
2. Add enclosing-callable and convention evidence to WordPress.
3. Move WooCommerce-owned extraction into its dependent plugin.
4. Materialize mediated execution in CE and surface it in callgraph.
5. Validate unit/golden tests, plugin build, endpoint integrity, full and
   targeted reindex, then run corpus questions requiring hook/route knowledge.

Acceptance requires deterministic replacement, no dangling endpoints, explicit
dynamic/ambiguous outcomes, coverage for every capability, and callgraph output
which labels mediated execution without a framework-specific query.
