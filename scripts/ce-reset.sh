#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runs_root="$root/demo/runs"
data_dir="${CE_DATA_DIR:-$runs_root/ce-data}"

if [ "${1:-}" != "--yes" ]; then
  printf 'Refusing to remove %s without --yes\n' "$data_dir" >&2
  exit 2
fi

case "/$data_dir/" in
  */../*)
    printf 'Refusing to remove data containing directory traversal: %s\n' "$data_dir" >&2
    exit 2
    ;;
esac

mkdir -p "$runs_root"
runs_root="$(cd -P "$runs_root" && pwd -P)"
data_parent="$(dirname "$data_dir")"
data_name="$(basename "$data_dir")"
case "$data_name" in
  .|..|'')
    printf 'Refusing to remove the CE data root itself: %s\n' "$data_dir" >&2
    exit 2
    ;;
esac
if ! data_parent="$(cd -P "$data_parent" 2>/dev/null && pwd -P)"; then
  printf 'Refusing to remove data with an unresolved parent: %s\n' "$data_dir" >&2
  exit 2
fi
data_dir="$data_parent/$data_name"

case "$data_dir" in
  "$runs_root"/*) ;;
  *)
    printf 'Refusing to remove data outside %s: %s\n' "$runs_root" "$data_dir" >&2
    exit 2
    ;;
esac

rm -rf "$data_dir"
printf 'Removed CE demo data: %s\n' "$data_dir"
