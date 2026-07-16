#!/usr/bin/env bash
set -euo pipefail

if ! command -v skillex >/dev/null; then
  printf 'Skillex is not installed. Install it before running the CE + Skillex comparison.\n' >&2
  exit 1
fi

exec skillex refresh "$@"
