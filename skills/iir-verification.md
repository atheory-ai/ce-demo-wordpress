---
name: Bounded IIR Verification
description: Use the demo IIR fixtures to show declared intent, deterministic artifacts, and honest verification.
topics: [iir, semantic-verification, typescript]
tags: [intent, policy, coverage, repair]
---

# Bounded IIR Verification

The IIR demonstration is deliberately smaller than the WordPress source
constellation. It proves a specific loop: declared TypeScript function intent
can deterministically produce code/tests and be compared with source.

## Procedure

1. Start with an intent fixture in `demo/iir/intents/`; explain its inputs,
   effects, failures, and declared constraints.
2. Run `scripts/iir-smoke.sh` or the individual `ce iir generate`,
   `gen-tests`, and `verify` commands.
3. Compare positive, negative, and inconclusive outcomes by the evidence and
   coverage reported—not by whether generated code looks plausible.
4. Relate the fixture to Task 04 as a client-side cache/update boundary only.
   Cite WordPress/Gutenberg source separately when discussing the real flow.

## Boundaries

- Generation and test emission are TypeScript-only.
- Generated tests are a test plan/artifact, not proof that a project test suite
  executed.
- PHP structural/convention plugins do not yet provide modeled semantic
  verification; never turn their facts into a passing IIR claim.
- Policy/conformance results apply to the declared function intent. They do not
  prove whole-program behavior, hook scheduling, or runtime authorization.
