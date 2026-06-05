#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'demo contract check failed: %s\n' "$1" >&2
  exit 1
}

has_path() {
  git cat-file -e "HEAD:$1" 2>/dev/null
}

tracked_mode() {
  git ls-files --stage -- "$1" | awk '{ print $1 }'
}

branch_name="${GITHUB_BASE_REF:-${GITHUB_REF_NAME:-}}"
if [ -z "$branch_name" ]; then
  branch_name="$(git branch --show-current)"
fi

case "$branch_name" in
  main|ce) ;;
  *)
    printf 'Skipping demo contract checks for branch %s\n' "${branch_name:-unknown}"
    exit 0
    ;;
esac

for path in \
  README.md \
  .gitmodules \
  demo/README.md \
  demo/prompts/baseline-agent-prompt.md \
  demo/prompts/context-acquisition-benchmark.md \
  demo/report-template.md \
  demo/tasks/01-block-registration-and-rendering.md \
  demo/tasks/02-checkout-field-validation.md \
  demo/tasks/03-product-price-display.md \
  demo/tasks/04-rest-api-editor-data-flow.md \
  demo/tasks/05-block-serialization-regression.md \
  specs/02-BRANCH-CONTRACT.md
do
  has_path "$path" || fail "required shared file is missing: $path"
done

for submodule in wordpress gutenberg woocommerce; do
  [ "$(tracked_mode "$submodule")" = "160000" ] || fail "$submodule must be tracked as a git submodule"
done

git submodule status --recursive >/dev/null || fail "submodules must initialize cleanly"

if [ "$branch_name" = "main" ]; then
  for prohibited in \
    ce.yaml \
    demo/queries \
    demo/expected \
    demo/studio-flow.md \
    scripts/ce-index.sh \
    scripts/ce-query.sh \
    scripts/ce-reset.sh \
    skillex.yaml \
    skillex
  do
    if has_path "$prohibited"; then
      fail "main must stay source-only; prohibited CE path exists: $prohibited"
    fi
  done
fi

if [ "$branch_name" = "ce" ]; then
  for required in \
    AGENTS.md \
    ce.yaml \
    demo/benchmark-instructions-checkout-field-validation.md \
    demo/benchmark-instructions-store-api-headless-cart-merge.md \
    demo/benchmark-instructions-zero-cost-renewal.md \
    demo/comparison-report-2026-05-29-checkout-field-validation.md \
    demo/comparison-report-2026-05-29-zero-cost-renewal.md \
    demo/comparison-report-2026-06-01-store-api-headless-cart-merge.md \
    demo/comparison-report-2026-06-02-store-api-direct-tools.md \
    demo/tasks/06-zero-cost-renewal-draft-order.md \
    demo/tasks/07-store-api-headless-cart-merge.md
  do
    has_path "$required" || fail "ce branch required file is missing: $required"
  done

  if git show-ref --verify --quiet refs/remotes/origin/main; then
    for submodule in wordpress gutenberg woocommerce; do
      current_sha="$(git rev-parse "HEAD:$submodule")"
      main_sha="$(git rev-parse "origin/main:$submodule")"
      [ "$current_sha" = "$main_sha" ] || fail "$submodule SHA differs from origin/main"
    done
  else
    printf 'origin/main not available; skipped CE submodule alignment check\n'
  fi
fi

printf 'Demo contract checks passed for %s\n' "$branch_name"
