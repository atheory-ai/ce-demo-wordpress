# 20 Demo Learning Architecture

## Purpose

Define a reusable architecture for Context Engine demonstration repositories.
The WordPress ecosystem is the flagship instance because it is familiar,
dynamic, multi-language, and large enough that an agent cannot reliably hold
its real behavior in prompt context. The architecture must also transfer to
other languages, frameworks, and project shapes without copying WordPress
content or pretending their capabilities are identical.

## North-star lesson

A CE demo is not a product tour. It lets a user experience a progression:

```text
unfamiliar request
  -> grounded source context
  -> explicit uncertainty and decisions
  -> declared semantic intent where supported
  -> constrained implementation/test artifacts
  -> evidence-backed verification or an honest boundary
```

The point is to show uncertainty being reduced before code is authored—not to
claim that CE replaces engineering judgement, source review, or runtime tests.

## Two complementary journeys

### Guided progression

Offer a linear route for a first-time viewer:

1. baseline task on source-only `main`;
2. identical task using CE graph and source tools on `ce`;
3. optional CE + Skillex procedural run;
4. bounded IIR intent → artifact → verification exercise;
5. plugin authoring/extension exercise.

Each step has a stated question, evidence source, expected artifact, acceptance
criterion, and capability boundary. A viewer can stop after any step and still
learn something truthful.

### Question-led exploration

Permit an experienced developer or AI to enter through a real question: “where
does this checkout value cross the Store API boundary?” The agent selects the
relevant CE and Skillex procedures, obtains source anchors, and produces an
evidence-backed answer. It may later enter the IIR or plugin-authoring paths;
it is never forced to replay a tutorial.

Guided and question-led modes share the same fixtures, source pin, report
format, evidence rules, and capability matrix. They differ only in navigation.

## Demo layers and division of labor

| Layer | Responsibility | Must not claim |
| --- | --- | --- |
| Source constellation | A realistic pinned codebase and task corpus | A precomputed answer is runtime truth |
| Baseline | Fair manual context acquisition control | That more searches mean poorer reasoning |
| Context Engine | Indexed symbols, relationships, source retrieval, and source-grounded navigation | Runtime behavior beyond evidence |
| IIR | Declared intent, deterministic lowerings, comparison, rules, and verification where coverage supports it | Whole-program or unsupported-language proof |
| Skillex | Portable procedures, checklists, and reporting discipline | Cached source knowledge or CE-derived answers |
| Plugins | Reusable language/framework extraction and rules | Dynamic behavior the extractor cannot ground |
| Measurement | Reproducible quality and effort evidence | A universal model-performance claim from one run |

## WordPress instantiation

WordPress provides PHP hooks and REST controllers; Gutenberg supplies
TypeScript/React data stores; WooCommerce adds commerce and Store API
boundaries. The demo should use that shape to show why filename search and
framework familiarity are not enough.

Current truthful coverage is deliberately uneven:

- PHP and convention plugins provide structural navigation facts after they are
  built from this repository.
- The IIR walkthrough uses TypeScript only and is bounded to a Task 04-style
  client cache operation.
- PHP semantic verification, whole-flow verification, durable public
  semantic-plan history, and a polished Studio flow remain release gates, not
  presentation claims.

## Required portable repository shape

Every future CE demo should preserve this contract, adapted to its ecosystem:

```text
README.md                    entry points and capability matrix
demo/tasks/                  user-realistic questions
demo/prompts/                fair baseline and CE instructions
demo/iir/                    checked-in semantic inputs and expectations
plugins/                     optional demo-owned language/framework extensions
skills/ + skillex.yaml       procedural guidance, never answer caches
scripts/                     doctor, index, reset, semantic smoke checks
specs/                       claims, design, delivery gates, and lessons
```

The baseline must remain source-only; CE-only assets belong on the comparison
branch. If a repository cannot support a layer yet, it says so directly rather
than adding a theatrical placeholder.

## Content and evidence standards

- Every claim identifies its capability status: indexed, partial, modeled,
  verified, failed, inconclusive, or unsupported.
- Every semantic demonstration names the exact supported language and bounded
  unit.
- Skills provide decision rules and stop conditions, not source facts that an
  agent should retrieve from CE.
- A report records revisions, versions/hashes, active skills, evidence paths,
  unknowns, and repair/test gaps.
- A baseline can beat CE. Record it and use the result to improve CE or the
  task design.

## Reusable acceptance gates

1. A fresh checkout can build any documented demo-owned plugins and run doctor,
   index, reset, and smoke scripts with only documented prerequisites.
2. Baseline, CE, and CE + Skillex are distinguishable experimental conditions.
3. The first IIR fixture has positive, negative, and inconclusive outcomes
   before performance claims are made.
4. Plugin fixtures prove the facts they emit and label unresolved dynamic
   behavior.
5. README, agent guidance, skills, scripts, and CI agree on installed versus
   planned capabilities.

## Next implementation work

This architecture does not supersede Specs 12–19. It gives them a user-facing
and reusable frame. The immediate WordPress sequence is:

1. land the contract repair, published-SDK setup, scripts, and skills;
2. validate the plugin build and tiny fixture with a released CE binary;
3. make the Task 04 IIR fixture positive/negative/inconclusive with checked-in
   expectations and CI;
4. add a concise Studio walkthrough only once the public surface can expose
   the required lineage; and
5. advance PHP/WooCommerce semantic claims only through grounded plugin lift
   fixtures and release gates.
