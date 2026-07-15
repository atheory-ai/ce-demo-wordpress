# 15 Semantic Benchmark Corpus And Measurement

## Goal

Extend the paired benchmark so it measures semantic development quality in
addition to discovery speed.

## Benchmark modes

### Context acquisition

Retain the existing `main` versus `ce` measurement: time to grounded context,
lookup effort, source coverage, relationship accuracy, and unsupported claims.

### Semantic change planning

Give both fresh agents the same natural-language change request and source
snapshot. The baseline returns a source-cited implementation/test plan. The CE
run returns that plan plus its declared intent, semantic plan, evidence,
obligations, recipe, and test plan.

The evaluator compares each answer against a blinded expected-facts rubric; it
must not reward CE merely for producing more structured output.

### Semantic verification

Run only for fixtures with modeled language coverage. Score pass/fail/
inconclusive correctness, evidence quality, and repair specificity.

## Required report fields

Add these fields to the paired report template:

- source, CE, plugin, rules, and policy versions/hashes;
- semantic unit and plan revision IDs;
- declared facts, resolved bindings, and open questions;
- mandatory and forbidden effects/failures;
- policy findings and approvals;
- observed coverage and verification verdict;
- generated or selected tests and remaining coverage gaps;
- repair delta, if any.

## Scoring rules

- `inconclusive` is correct when the source lift cannot prove an obligation.
- Unsupported claims and unverifiable semantic passes lower the score.
- A baseline may win when it finds a material fact CE missed.
- Speed and tool count are secondary to evidence-backed correctness and safe
  implementation guidance.

## Reproducibility

Each fixture/report records branch, commit, submodule SHAs, binary/plugin
hashes, model/provider configuration, operator, timestamps, and random seeds.
Run at least three paired repetitions before making a public performance claim.

