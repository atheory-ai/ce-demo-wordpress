# Tests: wordpress-plugin-authoring.md

## Validation: Build a demo plugin
Prompt: How do I build and validate the WordPress demo's CE plugins?
Success criteria:
  - Uses the published CE plugin SDK dependency
  - Requires building the demo-owned PHP grammar with its pinned toolchain and
    fixture validation
  - Uses CE plugin validation before source-constellation indexing
  - Does not claim that every CE installation provides PHP semantic verification

## Validation: Model dynamic framework behavior safely
Prompt: My new plugin sees a hook name in PHP source but cannot resolve the callback at runtime. What IIR coverage should it emit?
Success criteria:
  - Rejects modeled coverage without grounded claims and evidence
  - Recommends partial or unsupported coverage for unresolved dynamic behavior
  - Discourages regex-only semantic evidence
