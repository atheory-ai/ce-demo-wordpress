# Tests: ce-guided-investigation.md

## Validation: Trace an editor REST issue
Prompt: How should I investigate stale Gutenberg editor data after a REST response changes?
Success criteria:
  - Starts with CE anchors before broad source searching
  - Covers controller or route, client request, store or resolver, cache, and consumer
  - Distinguishes cited facts from unresolved runtime conditions

## Validation: Handle a broken CE setup
Prompt: CE cannot load the PHP plugin while I am running a CE-assisted benchmark. What should I do?
Success criteria:
  - Treats the failure as a setup or release blocker
  - Does not silently substitute broad filesystem discovery for a CE result
  - Requests or reports the relevant plugin or index diagnostic
