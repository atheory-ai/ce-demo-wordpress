# Demo CE plugins

These two plugins are intentionally separate: `php-language` owns generic PHP
structure and the `php-grammar.wasm` side module, while
`wordpress-conventions` adds framework facts from the same CST. The current
vocabulary and its evidence/coverage limits are specified in
[`specs/21-WORDPRESS-WOOCOMMERCE-SEMANTIC-VOCABULARY.md`](../specs/21-WORDPRESS-WOOCOMMERCE-SEMANTIC-VOCABULARY.md).

The convention plugin currently records observed hook, REST-route, block,
Store API extension, security-boundary, and cart-effect facts. It preserves
unresolved callback/configuration expressions rather than claiming PHP runtime
resolution, authorization correctness, or whole-program IIR verification.

```sh
pnpm install
TREE_SITTER_SOURCE_DIR="$(go env GOMODCACHE)/github.com/malivvan/tree-sitter@v0.0.1/src" \
  ZIG=/path/to/zig-0.13 \
  pnpm --filter php-language-plugin run build:grammar
pnpm test
pnpm build
```

Use only Zig 0.13.x and the ABI-14 corpus pinned in
`php-language/grammar.lock`. The resulting `dist/` artifacts are generated and
ignored; `ce.yaml` loads them after the build. The plugins depend on the
published `@atheory-ai/ce-plugin-sdk`; no sibling SDK checkout is required.

To start a new CE plugin beside this demo:

```sh
pnpm create @atheory-ai/ce-plugin
cd my-plugin
pnpm install
pnpm build
ce plugin validate dist/my-plugin.wasm
```

The published plugin sandbox's extraction command is currently incompatible
with CE (tracked in Context Engine issue #101). Until that release contract is
fixed, validate an artifact with `ce plugin validate` and the tiny fixture index
before adding it to `ce.yaml`.
