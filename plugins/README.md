# Demo CE plugins

These framework plugins intentionally depend on CE's certified first-party
`com.atheory-ai.php` default provider. `wordpress-conventions` adds framework
facts from the same host-parsed CST without carrying a private PHP fork. The
current vocabulary and its evidence/coverage limits are specified in
[`specs/21-WORDPRESS-WOOCOMMERCE-SEMANTIC-VOCABULARY.md`](../specs/21-WORDPRESS-WOOCOMMERCE-SEMANTIC-VOCABULARY.md).

The convention plugin currently records observed hook, REST-route, block,
Store API extension, security-boundary, and cart-effect facts. It preserves
unresolved callback/configuration expressions rather than claiming PHP runtime
resolution, authorization correctness, or whole-program IIR verification.

PHP structural symbol identities are stable per source declaration:
`<project-relative-path>:<namespace-or-global>:<kind>:<declaration>`. This
prevents same-named declarations in separate files or namespaces from sharing a
graph node.

```sh
pnpm install
pnpm test
pnpm build
```

The resulting framework `dist/` artifacts are generated and ignored; `ce.yaml`
loads them after the build and activates PHP from CE's embedded defaults. The
plugins depend on the published `@atheory-ai/ce-plugin-sdk`; no sibling SDK
checkout is required.

To start a new CE plugin beside this demo:

```sh
pnpm create @atheory-ai/ce-plugin
cd my-plugin
pnpm install
pnpm build
ce plugin validate dist/my-plugin.wasm
```

The published plugin sandbox exercises the same extraction contract as CE. Use
the same CE binary that will load the plugin, then validate a real fixture:

```sh
CE_BIN=/path/to/ce ../scripts/ce-regression.sh
```
