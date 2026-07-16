#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ce_bin="${CE_BIN:-ce}"
data_dir="${CE_DATA_DIR:-$root/demo/runs/ce-data}"
target="${1:-.}"

if [ "${1:-}" = "--full" ]; then
  target="${2:-.}"
  full=(--full)
else
  full=()
fi

mkdir -p "$data_dir"
cd "$root"
exec "$ce_bin" --config "$root/ce.yaml" --data-dir "$data_dir" \
  index "$target" "${full[@]}"
