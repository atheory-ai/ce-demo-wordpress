#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ce_bin="${CE_BIN:-ce}"
out_dir="${1:-$root/lmir-testing/results/$(date +%F)-rerun}"
fixture_dir="$root/lmir-testing/fixtures"
rules="$root/lmir-testing/rules/forbid-empty-key-equality.yaml"
rounds="${LMIR_ROUNDS:-1 2 3}"

if ! command -v "$ce_bin" >/dev/null 2>&1 && [ ! -x "$ce_bin" ]; then
  printf 'CE_BIN must name an executable CE binary; got %s\n' "$ce_bin" >&2
  exit 2
fi

mkdir -p "$out_dir"
out_dir="$(cd "$out_dir" && pwd)"
"$ce_bin" version > "$out_dir/ce-version.txt" 2>&1
shasum -a 256 "$fixture_dir"/* "$rules" > "$out_dir/fixture-sha256.txt"

run_verify() {
  local name="$1"
  local expected_exit="$2"
  local expected_status="$3"
  shift 3

  local actual_exit=0
  if "$@" > "$round_dir/$name.json" 2> "$round_dir/$name.stderr"; then
    actual_exit=0
  else
    actual_exit=$?
  fi
  printf '%s\n' "$actual_exit" > "$round_dir/$name.exit-code"

  if [ "$actual_exit" -ne "$expected_exit" ]; then
    printf '%s: exit %s, want %s\n' "$name" "$actual_exit" "$expected_exit" >&2
    exit 1
  fi
  if ! grep -Eq '"status"[[:space:]]*:[[:space:]]*"'"$expected_status"'"' "$round_dir/$name.json"; then
    printf '%s: expected status %s; report follows\n' "$name" "$expected_status" >&2
    sed -n '1,240p' "$round_dir/$name.json" >&2
    exit 1
  fi
}

for round in $rounds; do
  round_dir="$out_dir/run-$round"
  mkdir -p "$round_dir"

  "$ce_bin" iir generate "$fixture_dir/intent.yaml" --verify > "$round_dir/positive.generated.ts" 2> "$round_dir/positive.generate.stderr"
  "$ce_bin" iir gen-tests "$fixture_dir/intent.yaml" --coverage > "$round_dir/generated.test.ts" 2> "$round_dir/generated.test.stderr"
  run_verify positive.verify 0 passed "$ce_bin" iir verify "$fixture_dir/intent.yaml" "$fixture_dir/positive.ts" --json

  run_verify missing-effect 1 failed "$ce_bin" iir verify "$fixture_dir/intent.yaml" "$fixture_dir/missing-effect.ts" --json
  run_verify wrong-failure 1 failed "$ce_bin" iir verify "$fixture_dir/intent.yaml" "$fixture_dir/wrong-failure.ts" --json
  run_verify missing-return-type 1 failed "$ce_bin" iir verify "$fixture_dir/intent.yaml" "$fixture_dir/missing-return-type.ts" --json
  run_verify structural-policy 1 failed "$ce_bin" iir verify "$fixture_dir/intent.yaml" "$fixture_dir/positive.ts" --rules "$rules" --json

  "$ce_bin" iir repair "$fixture_dir/intent.yaml" "$fixture_dir/missing-effect.ts" > "$round_dir/repaired.ts" 2> "$round_dir/repair.stderr"
  run_verify repaired.verify 0 passed "$ce_bin" iir verify "$fixture_dir/intent.yaml" "$round_dir/repaired.ts" --json

  "$ce_bin" iir implement --intent "$fixture_dir/intent.yaml" > "$round_dir/implement.json" 2> "$round_dir/implement.stderr"
  if ! grep -Eq '"status"[[:space:]]*:[[:space:]]*"conditional"' "$round_dir/implement.json"; then
    printf 'implement: expected conditional status; report follows\n' >&2
    sed -n '1,240p' "$round_dir/implement.json" >&2
    exit 1
  fi

  isolated_dir="$(mktemp -d "${TMPDIR:-/tmp}/ce-lmir-isolation.XXXXXX")"
  ( cd "$isolated_dir" && "$ce_bin" iir verify "$fixture_dir/intent.yaml" "$fixture_dir/positive.ts" --json > "$round_dir/isolated.verify.json" 2> "$round_dir/isolated.verify.stderr" )
  if ! grep -Eq '"status"[[:space:]]*:[[:space:]]*"passed"' "$round_dir/isolated.verify.json"; then
    printf 'isolated verification: expected passed status; report follows\n' >&2
    sed -n '1,240p' "$round_dir/isolated.verify.json" >&2
    exit 1
  fi
  if [ -z "$(find "$isolated_dir" -mindepth 1 -print -quit)" ]; then
    printf 'empty\n' > "$round_dir/isolated.cwd-after.txt"
  else
    printf 'changed\n' > "$round_dir/isolated.cwd-after.txt"
  fi
  rmdir "$isolated_dir"

  shasum -a 256 "$round_dir"/*.json "$round_dir"/*.ts > "$round_dir/artifact-sha256.txt"
done

printf 'Raw experiment artifacts written to %s\n' "$out_dir"
