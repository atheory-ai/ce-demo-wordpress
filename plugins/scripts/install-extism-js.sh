#!/usr/bin/env sh
# Install the pinned, release-built production compiler toolchain locally.
# This mirrors CE's SDK bootstrap so demo plugin builds do not depend on a
# globally installed Extism compiler or on a separately checked-out SDK repo.
set -eu

dest=${1:?usage: install-extism-js.sh <destination>}
extism_version=v1.5.1
binaryen_version=version_131

case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) extism_target=x86_64-linux; binaryen_target=x86_64-linux ;;
  Linux-aarch64|Linux-arm64) extism_target=aarch64-linux; binaryen_target=aarch64-linux ;;
  Darwin-x86_64) extism_target=x86_64-macos; binaryen_target=x86_64-macos ;;
  Darwin-arm64) extism_target=aarch64-macos; binaryen_target=arm64-macos ;;
  *) echo "unsupported platform: $(uname -s)-$(uname -m)" >&2; exit 1 ;;
esac

mkdir -p "$dest/bin"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/ce-demo-extism-tools.XXXXXX")
trap 'rm -rf "$tmp"' EXIT

curl -fsSL "https://github.com/extism/js-pdk/releases/download/${extism_version}/extism-js-${extism_target}-${extism_version}.gz" \
  | gzip -dc >"$dest/bin/extism-js"
chmod +x "$dest/bin/extism-js"

curl -fsSL "https://github.com/WebAssembly/binaryen/releases/download/${binaryen_version}/binaryen-${binaryen_version}-${binaryen_target}.tar.gz" \
  | tar -xz -C "$tmp"
binaryen_merge=$(find "$tmp" -type f -name wasm-merge -print -quit)
if [ -z "$binaryen_merge" ]; then
  echo "Binaryen release did not contain wasm-merge" >&2
  exit 1
fi
binaryen_bin=$(dirname "$binaryen_merge")
cp "$binaryen_bin/wasm-merge" "$binaryen_bin/wasm-opt" "$dest/bin/"
# macOS Binaryen executables link to ../lib/libbinaryen.dylib. Keep the
# release libraries adjacent to the project-local binaries so the demo build
# remains independent of Homebrew or a globally installed toolchain.
binaryen_root=$(dirname "$binaryen_bin")
if [ -d "$binaryen_root/lib" ]; then
  mkdir -p "$dest/lib"
  cp -R "$binaryen_root/lib/." "$dest/lib/"
fi
echo "$dest/bin"
