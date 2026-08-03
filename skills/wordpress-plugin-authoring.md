---
name: WordPress Demo Plugin Authoring
description: Build, validate, and extend CE WebAssembly plugins without conflating framework facts with runtime proof.
topics: [plugin-authoring, wasm, wordpress, php]
tags: [sdk, tree-sitter, sandbox, iir]
---

# WordPress Demo Plugin Authoring

The demo plugins make CE extensible: generic PHP structure belongs in CE's
certified first-party language provider; WordPress and WooCommerce conventions
belong in additive framework analyzers. Neither should invent runtime facts.

## Build this repository's plugins

1. Run `pnpm install` in `plugins/` using the published SDK dependency.
2. Use a CE build that includes the certified `com.atheory-ai.php` default.
3. Run `pnpm test && pnpm build` for the framework plugins.
4. Validate each framework artifact with `ce plugin validate` and index the
   tiny fixture before attempting the source constellation.

## Start a new plugin

```sh
pnpm create @atheory-ai/ce-plugin
cd my-plugin
pnpm install
pnpm build
ce plugin validate dist/my-plugin.wasm
```

Use `ce plugin validate`, the tiny fixture index, and the published
`@atheory-ai/ce-plugin-sandbox` against the same CE binary that will load the
plugin:

```sh
ce-sandbox run dist/my-plugin.wasm tests/fixtures/example.php --ce /path/to/ce --json
```

## Semantic authoring rules

- Consume CE's host-provided PHP CST and structural contribution; do not
  duplicate the language parser or use regex as evidence for semantics.
- Use deterministic SDK node and edge IDs.
- Attach v1 IIR claims only when the extractor can supply grounded spans and a
  conservative classifier basis.
- Mark dynamic hooks, callbacks, reflection, and unresolved framework behavior
  as partial or unsupported rather than modeled.
