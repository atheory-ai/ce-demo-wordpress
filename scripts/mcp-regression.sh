#!/usr/bin/env bash
set -euo pipefail

# Requires ce-regression.sh to have indexed the tiny fixture with this same
# data directory. This covers the stdio MCP transport used by coding agents.
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ce_bin="${CE_BIN:-ce}"
data_dir="${CE_DATA_DIR:-$root/demo/runs/ce-regression-data}"

output="$(printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"wordpress-demo-regression","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"ce_search","arguments":{"query":"wordpress-hooks","type":"file","limit":5}}}' \
  | "$ce_bin" --config "$root/ce.yaml" --data-dir "$data_dir" mcp-stdio)"

printf '%s\n' "$output"
grep -Eq '"protocolVersion"[[:space:]]*:[[:space:]]*"2024-11-05"' <<<"$output" || {
  printf 'MCP initialization did not return the expected protocol version\n' >&2
  exit 1
}
grep -q 'wordpress-hooks.php' <<<"$output" || {
  printf 'MCP ce_search did not return the indexed fixture file\n' >&2
  exit 1
}

printf 'CE MCP stdio regression check passed\n'
