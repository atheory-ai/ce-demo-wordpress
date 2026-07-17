# 19 IIR Demo Delivery Plan

## Phase 1: Contract repair

Implement Spec 12. Publish accurate CE-branch documentation and deterministic
setup/doctor scripts. No semantic verification claim is allowed yet.

## Phase 2: Public semantic surface

Implement Spec 13. Choose a stable public interface or versioned harness, then
record artifact lineage and reproducible outputs.

## Phase 3: TypeScript pilot

Implement Spec 14 for one Task 04 unit. Add golden fixtures and CI checks for
positive, negative, and inconclusive verification outcomes.

## Phase 4: Benchmark and Studio

Implement Specs 15 and 16. Run a small pilot of three paired repetitions and
produce an evidence-backed comparison report.

## Phase 5: PHP flagship capability

Implement Spec 17. Do not promote checkout or Store API semantic verification
until the PHP/convention plugin has its own release and fixture gates.

## Phase 6: Optional Skillex comparison

Implement Spec 18 only after the CE-only IIR demo is valid, so the sources of
benefit remain distinguishable.

## Release gate

The upgraded demo is ready to present when:

- `main` and `ce` satisfy their branch contracts;
- setup is reproducible from a fresh checkout;
- the TypeScript pilot has deterministic positive/negative/inconclusive
  artifacts;
- all semantic claims show source evidence and coverage status;
- the Studio walkthrough shows lineage and limitations; and
- any PHP/WooCommerce claim is constrained to shipped, tested capability.

