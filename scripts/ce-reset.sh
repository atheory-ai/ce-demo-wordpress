#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
data_dir="${CE_DATA_DIR:-$root/demo/runs/ce-data}"

if [ "${1:-}" != "--yes" ]; then
  printf 'Refusing to remove %s without --yes\n' "$data_dir" >&2
  exit 2
fi

case "$data_dir" in
  "$root"/demo/runs/*) ;;
  *)
    printf 'Refusing to remove data outside %s/demo/runs: %s\n' "$root" "$data_dir" >&2
    exit 2
    ;;
esac

rm -rf "$data_dir"
printf 'Removed CE demo data: %s\n' "$data_dir"
