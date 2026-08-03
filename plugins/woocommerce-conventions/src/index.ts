import { definePlugin } from "@atheory-ai/ce-plugin-sdk"
import type { ExtractionResult } from "@atheory-ai/ce-plugin-sdk"
import { extract } from "./extract.js"
import { match } from "./match.js"

const decorate = (filePath: string, content: string, tree: Parameters<typeof extract>[2], contribution: ExtractionResult, sourceAnchor?: Parameters<typeof extract>[3]) =>
  extract(filePath, content, tree, sourceAnchor, contribution)

// WooCommerce-specific semantic requirements. This manifest-only plugin never
// parses source or mutates a plan; CE evaluates these policy records.
export default definePlugin({
  id: "com.atheory-ai.wordpress-demo.woocommerce-conventions",
  name: "WooCommerce Conventions (Demo)",
  version: "0.6.0",
  claims: [
    { capability: "ce.framework.lifecycle.woocommerce/1", evidence_schema: "semantic-occurrences/v1", coverage_profile: "woocommerce-lifecycle/v1" },
    { capability: "ce.framework.state.woocommerce/1", evidence_schema: "semantic-occurrences/v1", coverage_profile: "woocommerce-state/v1" },
  ],
  dependencies: {
    plugins: [
      "com.atheory-ai.wordpress-demo.php",
      "com.atheory-ai.wordpress-demo.conventions",
    ],
  },
  index: {
    phase: "file.decorate",
    scope: "file",
    requires: ["artifact:source", "artifact:cst:php", "facts:php-structure", "mechanics:php:v1", "framework:wordpress", "semantics:wordpress-state"],
    provides: ["framework:woocommerce", "semantics:woocommerce-state"],
    enriches: ["php"],
  },
  semanticPolicies: {
    schemaVersion: "v1",
    languages: ["php"],
    policies: [
      {
        id: "woocommerce-demo.cart.use-cart-api",
        version: "v1",
        phase: "constrain",
        priority: 10,
        when: { allClaimKinds: ["context.woocommerce.cart", "operation.cart.modify"] },
        severity: "error",
        add: {
          kind: "commerce.cart-api",
          requirement: "perform the mutation through the WooCommerce cart/customer API and preserve cart recalculation and session behavior; do not mutate cart internals directly",
          mandatory: true,
        },
      },
      {
        id: "woocommerce-demo.cart.validate-request",
        version: "v1",
        phase: "constrain",
        priority: 20,
        when: { allClaimKinds: ["context.woocommerce.cart", "operation.cart.modify", "input.user_controlled"] },
        severity: "error",
        add: {
          kind: "commerce.input-validation",
          requirement: "validate product, quantity, variation, and cart-item input before the WooCommerce cart mutation",
          mandatory: true,
        },
      },
      {
        id: "woocommerce-demo.checkout.validation-hook",
        version: "v1",
        phase: "constrain",
        priority: 30,
        when: { allClaimKinds: ["context.woocommerce.checkout", "operation.checkout.validate"] },
        severity: "error",
        add: {
          kind: "hook",
          requirement: "use the WooCommerce checkout validation extension point appropriate to the checkout flow, including woocommerce_after_checkout_validation when validating submitted checkout data",
          mandatory: true,
        },
      },
      {
        id: "woocommerce-demo.checkout.failure-convention",
        version: "v1",
        phase: "constrain",
        priority: 40,
        when: { allClaimKinds: ["context.woocommerce.checkout", "operation.checkout.validate"] },
        severity: "error",
        add: {
          kind: "failure.strategy",
          requirement: "report recoverable classic-checkout validation failures through WooCommerce's error/notice mechanism rather than throwing",
          mandatory: true,
        },
      },
      {
        id: "woocommerce-demo.store-api.error-contract",
        version: "v1",
        phase: "constrain",
        priority: 50,
        when: { allClaimKinds: ["surface.woocommerce.store_api", "operation.mutate"] },
        severity: "error",
        add: {
          kind: "api.error-contract",
          requirement: "return failures through the Store API error/response contract; do not use classic checkout notices as the API response channel",
          mandatory: true,
        },
      },
      {
        id: "woocommerce-demo.extension.quality-gate",
        version: "v1",
        phase: "verify",
        priority: 60,
        when: { claimKinds: ["context.woocommerce"] },
        severity: "warning",
        add: {
          kind: "quality.gate.woocommerce",
          requirement: "pass WooCommerce Sniffs and the configured WordPress Coding Standards/compatibility checks for the supported platform versions",
          mandatory: true,
        },
      },
    ],
  },
  language: {
    extensions: [".php", ".phtml"],
    customMatch: true,
    match,
    extract,
    decorate,
  },
})
