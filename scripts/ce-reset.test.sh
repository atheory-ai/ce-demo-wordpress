#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runs_root="$root/demo/runs"
outside_sentinel="$root/demo/ce-reset-outside-sentinel"

cleanup() {
  rm -rf "$test_root" "$outside_sentinel"
}
trap cleanup EXIT

mkdir -p "$runs_root"
test_root="$(mktemp -d "$runs_root/ce-reset-test.XXXXXX")"

mkdir -p "$test_root/removable"
CE_DATA_DIR="$test_root/removable" "$root/scripts/ce-reset.sh" --yes
[ ! -e "$test_root/removable" ]

printf 'do-not-delete\n' > "$outside_sentinel"
if CE_DATA_DIR="$runs_root/../ce-reset-outside-sentinel" "$root/scripts/ce-reset.sh" --yes; then
  printf 'expected traversal path to be rejected\n' >&2
  exit 1
fi
[ -f "$outside_sentinel" ]

if CE_DATA_DIR="$runs_root/." "$root/scripts/ce-reset.sh" --yes; then
  printf 'expected CE data root to be rejected\n' >&2
  exit 1
fi
