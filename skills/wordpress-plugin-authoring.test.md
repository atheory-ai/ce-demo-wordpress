# Tests: wordpress-plugin-authoring.md

## Validation: Build a demo plugin
Prompt: How do I build and validate the WordPress demo's CE plugins?
Success criteria:
  - Uses the published CE plugin SDK dependency
  - Requires a CE build with the certified first-party PHP provider
  - Builds only the demo-owned framework plugins and validates the tiny fixture
  - Uses CE plugin validation before source-constellation indexing
  - Does not duplicate or override PHP parsing in the demo

## Validation: Model dynamic framework behavior safely
Prompt: My new plugin sees a hook name in PHP source but cannot resolve the callback at runtime. What IIR coverage should it emit?
Success criteria:
  - Rejects modeled coverage without grounded claims and evidence
  - Recommends partial or unsupported coverage for unresolved dynamic behavior
  - Discourages regex-only semantic evidence
