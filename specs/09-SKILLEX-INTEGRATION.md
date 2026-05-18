# 09 Skillex Integration

Skillex belongs on the `ce` branch as procedural and domain guidance layered on
top of CE's indexed source knowledge.

## Division Of Labor

CE should answer:

- what source exists
- where symbols, files, APIs, and relationships are
- how code paths connect
- which anchors were activated for a query

Skillex should answer:

- how an agent should approach WordPress ecosystem work
- which reasoning checklists apply to a task
- how to report uncertainty
- how to avoid common domain mistakes
- how to compare baseline and CE-assisted runs

## Candidate Skills

Public skills:

- WordPress hook and filter tracing
- Gutenberg block architecture
- WooCommerce domain model
- REST API investigation
- source-grounded answer format

Private/demo skills:

- benchmark evaluator
- demo runner workflow
- CE query selection
- Studio walkthrough presenter notes

## Skill Principles

- Keep skills short and procedural.
- Do not paste large source facts into skills.
- Prefer checklists and decision rules.
- Make skills path-aware where possible.
- Use CE for source retrieval and Skillex for agent behavior.

## Demo Claim

The combined story is:

> CE gives the agent durable indexed knowledge of the codebase; Skillex teaches
> the agent how to use that knowledge in the domain.

This should be evaluated separately from CE alone where possible.
