import { definePlugin } from "@atheory-ai/ce-plugin-sdk"
import type { ExtractionResult } from "@atheory-ai/ce-plugin-sdk"
import { extract } from "./extract.js"
import { match } from "./match.js"

// This is a genuine file decorator: PHP has already produced and CE has
// canonicalized the structural file contribution. WordPress facts remain
// additive, but their phase and global dependency are now explicit instead of
// relying on configuration order or writer timing.
const decorate = (filePath: string, content: string, tree: Parameters<typeof extract>[2], contribution: ExtractionResult, sourceAnchor?: Parameters<typeof extract>[3]) =>
  extract(filePath, content, tree, sourceAnchor, contribution)

export default definePlugin({
  id: "com.atheory-ai.wordpress-demo.conventions",
  name: "WordPress Conventions (Demo)",
  version: "0.6.0",
  dependencies: {
    plugins: ["com.atheory-ai.wordpress-demo.php"],
  },
  index: {
    phase: "file.decorate",
    scope: "file",
    requires: ["artifact:source", "artifact:cst:php", "facts:php-structure"],
    enriches: ["php"],
  },
  // These are implementation-packet requirements. CE only activates a policy
  // after model/agent input or graph resolution has established every required
  // controlled semantic tag; no policy guesses a request surface or authority.
  semanticPolicies: {
    schemaVersion: "v1",
    languages: ["php"],
    policies: [
      {
        id: "wordpress-demo.request.validate-input",
        version: "v1",
        phase: "constrain",
        priority: 10,
        when: { allClaimKinds: ["surface.wordpress.request", "input.user_controlled"] },
        severity: "error",
        add: {
          kind: "input.validation",
          requirement: "validate the expected input shape; when validation is insufficient, sanitize WordPress request values before use",
          mandatory: true,
        },
      },
      {
        id: "wordpress-demo.request.csrf",
        version: "v1",
        phase: "constrain",
        priority: 20,
        when: { allClaimKinds: ["surface.wordpress.request", "operation.mutate"] },
        severity: "error",
        add: {
          kind: "csrf",
          requirement: "verify the appropriate WordPress nonce for a request-triggered mutation; do not treat a nonce as authorization",
          mandatory: true,
        },
      },
      {
        id: "wordpress-demo.admin.capability",
        version: "v1",
        phase: "constrain",
        priority: 30,
        when: { allClaimKinds: ["surface.wordpress.admin", "operation.mutate"] },
        severity: "error",
        add: {
          kind: "authorization",
          requirement: "require the least-privileged relevant WordPress capability before the administrative mutation",
          mandatory: true,
        },
      },
      {
        id: "wordpress-demo.html.escape-late",
        version: "v1",
        phase: "constrain",
        priority: 40,
        when: { allClaimKinds: ["output.html", "input.user_controlled"] },
        severity: "error",
        add: {
          kind: "output.escaping",
          requirement: "escape dynamic output as late as possible with the WordPress helper appropriate to its HTML, attribute, URL, or allowed-HTML context",
          mandatory: true,
        },
      },
      {
        id: "wordpress-demo.database.prepared-boundary",
        version: "v1",
        phase: "constrain",
        priority: 50,
        when: { claimKinds: ["effect.database.query"] },
        severity: "error",
        add: {
          kind: "database.boundary",
          requirement: "prefer an existing WordPress API; if a raw $wpdb query is necessary, prepare it at the query boundary",
          mandatory: true,
        },
      },
      {
        id: "wordpress-demo.user-text.translation",
        version: "v1",
        phase: "pre_generate",
        priority: 60,
        when: { allClaimKinds: ["context.wordpress.plugin", "output.user_facing_text"] },
        severity: "error",
        add: {
          kind: "i18n",
          requirement: "make user-facing text translatable with the extension's established text domain",
          mandatory: true,
        },
      },
      {
        id: "wordpress-demo.extension.quality-gate",
        version: "v1",
        phase: "verify",
        priority: 70,
        when: { claimKinds: ["context.wordpress.plugin"] },
        severity: "warning",
        add: {
          kind: "quality.gate.wordpress",
          requirement: "pass the project WordPress Coding Standards PHPCS ruleset; preserve the project's documented PHP naming, visibility, and documentation conventions",
          mandatory: true,
        },
      },
    ],
  },
  language: {
    // PHP Language owns parsing and declares php-grammar.wasm. This additive
    // plugin receives that same CST and contributes only framework facts.
    extensions: [".php", ".phtml"],
    customMatch: true,
    match,
    extract,
    decorate,
  },
})
