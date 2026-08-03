#!/usr/bin/env bash
set -euo pipefail

# Exercise the smallest complete supported PHP demo path against a released CE
# binary: build artifacts, file-scoped plugin composition, and sandbox output.
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ce_bin="${CE_BIN:-ce}"
data_dir="${CE_DATA_DIR:-$root/demo/runs/ce-regression-data}"
fixture="$root/demo/fixtures/php-iir"

for artifact in \
  "$root/plugins/wordpress-conventions/dist/wordpress-conventions.wasm"
do
  [ -f "$artifact" ] || { printf 'missing demo plugin artifact: %s\n' "$artifact" >&2; exit 1; }
done

index_output="$(CE_BIN="$ce_bin" CE_DATA_DIR="$data_dir" "$root/scripts/ce-index.sh" --full "$fixture")"
printf '%s\n' "$index_output"
grep -Eq 'Index complete: 1 files indexed, [1-9][0-9]* nodes, [1-9][0-9]* edges' <<<"$index_output" || {
  printf 'tiny fixture did not produce a non-empty one-file graph\n' >&2
  exit 1
}
grep -Eq 'semantics: [1-9][0-9]* entities, [1-9][0-9]* occurrences, [1-9][0-9]* relationships' <<<"$index_output" || {
  printf 'tiny fixture did not produce framework semantic entities, occurrences, and relationships\n' >&2
  exit 1
}

php_plugin="$data_dir/plugins/defaults/php-language.wasm"
php_grammar="$data_dir/plugins/defaults/php-grammar.wasm"
for artifact in "$php_plugin" "$php_grammar"; do
  [ -f "$artifact" ] || { printf 'CE did not extract certified PHP default: %s\n' "$artifact" >&2; exit 1; }
done

sandbox_output="$(cd "$root/plugins" && pnpm exec ce-sandbox run "$php_plugin" "$fixture/wordpress-hooks.php" --ce "$ce_bin" --json)"
printf '%s\n' "$sandbox_output"
grep -Eq '"canonicalID"[[:space:]]*:[[:space:]]*".*/?wordpress-hooks\.php"' <<<"$sandbox_output" || {
  printf 'sandbox extraction did not return the PHP fixture file node\n' >&2
  exit 1
}

printf 'CE plugin/index/sandbox regression checks passed\n'
