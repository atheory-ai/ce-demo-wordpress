# 17 PHP, WordPress, And WooCommerce Semantic Capability

## Goal

Enable the flagship checkout and Store API scenarios to make bounded,
evidence-backed semantic claims about PHP and WordPress/WooCommerce conventions.

## Language-plugin foundation

Build and release a PHP language plugin that can at minimum:

- parse PHP through the CE WASM plugin path;
- extract stable symbols and observed function intent;
- emit v1 claims, source evidence, and honest coverage states; and
- support standalone verification for the modeled subset.

The plugin requires golden positive, negative, and unsupported fixtures. It
must never report modeled coverage for dynamic PHP behavior it cannot observe.

## Convention plugin

Add an optional WordPress/WooCommerce analyzer that runs alongside generic PHP.
It should add evidence-bearing facts for the explicitly modeled subset:

- action/filter registration and invocation;
- REST route registration and callbacks;
- Store API request boundaries;
- checkout/block registration boundaries; and
- relevant test anchors.

The convention plugin enriches the semantic plan; it does not replace the PHP
language plugin or invent runtime behavior.

## Demonstration sequence

1. Use Task 02 for checkout field validation once its hook, Store API, and
   client/server boundary subset is modeled.
2. Use Task 07 for Store API cart merge only after authentication/session/cart
   facts have explicit coverage limitations and source evidence.
3. Keep PHP rendering and PHPUnit test rendering separate future milestones.
   Language-neutral recipes and analysis may ship before PHP code generation.

## Acceptance criteria

- The setup bundle contains the documented PHP plugin.
- Demo fixtures distinguish verified PHP facts from unresolved dynamic behavior.
- At least one WordPress/WooCommerce scenario reaches a legitimate semantic
  verdict without relying on a manually curated answer.

