#!/usr/bin/env bash
set -euo pipefail

# Zig invokes system tools that are not compatible with this machine's default
# C.UTF-8 locale. A C locale also makes this build deterministic across hosts.
export LANG=C
export LC_ALL=C

# Build the PHP grammar beside the plugin artifact. TREE_SITTER_SOURCE_DIR must
# point at the `src` directory of the pinned grammar corpus in ../grammar.lock.
# CE's core currently supports grammar language ABI 13–14; a current upstream
# tree-sitter-php checkout emits ABI 15 and cannot be used with this build.
if [ -z "${TREE_SITTER_SOURCE_DIR:-}" ]; then
  command -v go >/dev/null || { echo "Go is required to fetch the pinned tree-sitter corpus" >&2; exit 1; }
  go mod download github.com/malivvan/tree-sitter@v0.0.1
  TREE_SITTER_SOURCE_DIR="$(go env GOMODCACHE)/github.com/malivvan/tree-sitter@v0.0.1/src"
fi
SRC="$TREE_SITTER_SOURCE_DIR/php"
test -f "$SRC/parser.c"
test -f "$SRC/scanner.c"
ZIG="${ZIG:-zig}"
command -v "$ZIG" >/dev/null || { echo "Zig 0.13.x is required" >&2; exit 1; }
case "$("$ZIG" version)" in
  0.13.*) ;;
  *) echo "Zig 0.13.x is required; set ZIG=/path/to/zig-0.13" >&2; exit 1 ;;
esac

HERE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$HERE/dist"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$OUT"

"$ZIG" cc --target=wasm32-wasi-musl -fPIC -O2 -I "$SRC" -c "$SRC/parser.c" -o "$WORK/parser.o"
"$ZIG" cc --target=wasm32-wasi-musl -fPIC -O2 -I "$SRC" -c "$SRC/scanner.c" -o "$WORK/scanner.o"
"$ZIG" wasm-ld --experimental-pic -shared --no-entry --strip-debug \
  --export=tree_sitter_php --allow-undefined \
  "$WORK/parser.o" "$WORK/scanner.o" -o "$OUT/php-grammar.wasm"

shasum -a 256 "$OUT/php-grammar.wasm"
