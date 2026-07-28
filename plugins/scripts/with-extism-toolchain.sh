#!/usr/bin/env sh
# Run a command with the demo's project-local Extism compiler on PATH. An
# explicitly configured EXTISM_JS remains supported for managed environments.
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
plugins_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
tool_bin="$plugins_dir/.tools/extism/bin"

if [ -d "$tool_bin" ]; then
  PATH="$tool_bin:$PATH"
  export PATH
fi

compiler=${EXTISM_JS:-extism-js}
if ! command -v "$compiler" >/dev/null 2>&1; then
  echo "Production plugin compiler is unavailable: $compiler" >&2
  echo "Run: cd plugins && pnpm run toolchain:install" >&2
  exit 1
fi
for tool in wasm-merge wasm-opt; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Production plugin compiler dependency is unavailable: $tool" >&2
    echo "Run: cd plugins && pnpm run toolchain:install" >&2
    exit 1
  fi
done

exec "$@"
