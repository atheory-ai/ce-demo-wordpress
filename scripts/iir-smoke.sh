#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ce_bin="${CE_BIN:-ce}"
intent="$root/demo/iir/intents/task-04-cache-intent.yaml"
out_dir="${IIR_DEMO_OUT_DIR:-$root/demo/runs/iir-smoke}"

mkdir -p "$out_dir"
"$ce_bin" iir generate "$intent" > "$out_dir/task-04-cache.ts"
"$ce_bin" iir gen-tests "$intent" --coverage > "$out_dir/task-04-cache.test.ts"
"$ce_bin" iir verify "$intent" "$out_dir/task-04-cache.ts" \
  --json > "$out_dir/verification.json"

grep -Eq '"status"[[:space:]]*:[[:space:]]*"passed"' "$out_dir/verification.json" || {
  printf 'IIR smoke verification did not pass; inspect %s/verification.json\n' "$out_dir" >&2
  exit 1
}

printf 'IIR smoke artifacts written to %s\n' "$out_dir"
