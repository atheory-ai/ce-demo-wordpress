#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ce_bin="${CE_BIN:-ce}"
data_dir="${CE_DATA_DIR:-$root/demo/runs/ce-data}"

command -v "$ce_bin" >/dev/null || {
  printf 'Context Engine binary not found: set CE_BIN or install @atheory-ai/ce.\n' >&2
  exit 1
}

printf 'CE binary: %s\n' "$ce_bin"
cd "$root"
"$ce_bin" version
printf '\nSource constellation:\n'
for source in wordpress gutenberg woocommerce; do
  printf '  %s: ' "$source"
  git -C "$root" rev-parse "HEAD:$source"
done

printf '\nDemo plugin artifacts:\n'
for artifact in \
  plugins/php-language/dist/php-language.wasm \
  plugins/php-language/dist/php-grammar.wasm \
  plugins/wordpress-conventions/dist/wordpress-conventions.wasm
do
  if [ -f "$root/$artifact" ]; then
    printf '  %s  %s\n' "$(openssl dgst -sha256 "$root/$artifact" | awk '{print $NF}')" "$artifact"
  else
    printf '  MISSING  %s (run the plugin build)\n' "$artifact"
  fi
done

printf '\nEffective configuration:\n'
"$ce_bin" --config "$root/ce.yaml" --data-dir "$data_dir" config show
printf '\nLoaded plugins:\n'
"$ce_bin" --config "$root/ce.yaml" --data-dir "$data_dir" plugin list
