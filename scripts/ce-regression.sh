#!/usr/bin/env bash
set -euo pipefail

# Exercise the smallest complete supported PHP demo path against a released CE
# binary: build artifacts, file-scoped plugin composition, and sandbox output.
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ce_bin="${CE_BIN:-ce}"
data_dir="${CE_DATA_DIR:-$root/demo/runs/ce-regression-data}"
fixture="$root/demo/fixtures/php-iir"
php_plugin="$root/plugins/php-language/dist/php-language.wasm"

for artifact in \
  "$php_plugin" \
  "$root/plugins/php-language/dist/php-grammar.wasm" \
  "$root/plugins/wordpress-conventions/dist/wordpress-conventions.wasm"
do
  [ -f "$artifact" ] || { printf 'missing demo plugin artifact: %s\n' "$artifact" >&2; exit 1; }
done

index_output="$(CE_BIN="$ce_bin" CE_DATA_DIR="$data_dir" "$root/scripts/ce-index.sh" --full "$fixture")"
printf '%s\n' "$index_output"
grep -Eq 'Index complete: 1 files indexed, 11 nodes, 10 edges' <<<"$index_output" || {
  printf 'tiny fixture did not produce the expected 1 file / 11 node / 10 edge graph\n' >&2
  exit 1
}

sandbox_output="$(cd "$root/plugins" && pnpm exec ce-sandbox run "$php_plugin" "$fixture/wordpress-hooks.php" --ce "$ce_bin" --json)"
printf '%s\n' "$sandbox_output"
grep -Eq '"canonicalID"[[:space:]]*:[[:space:]]*".*/?wordpress-hooks\.php"' <<<"$sandbox_output" || {
  printf 'sandbox extraction did not return the PHP fixture file node\n' >&2
  exit 1
}

printf 'CE plugin/index/sandbox regression checks passed\n'
