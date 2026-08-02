# Tests: building-framework-intelligence.md

## Validation: Design a convention-heavy framework plugin
Prompt: Design a CE plugin for a framework whose routes and middleware are registered in configuration and whose event callbacks run by priority.
Success criteria:
  - Models configuration, registration, dispatch, lifecycle, and priority as graph evidence
  - Connects occurrences to enclosing structural callables
  - Keeps direct calls distinct from framework-mediated invocation
  - Requires explicit resolution outcomes and granular coverage
  - Makes the result discoverable through ordinary CE navigation

## Validation: Handle an unresolvable callback safely
Prompt: A framework callback is stored in a variable assembled at runtime. How should the plugin represent it?
Success criteria:
  - Retains the source expression and marks it dynamic
  - Does not invent a callback edge
  - Counts the unresolved form in capability coverage
  - Describes a fixture and replacement test for the boundary
