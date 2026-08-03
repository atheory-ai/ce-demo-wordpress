import { definePlugin } from "@atheory-ai/ce-plugin-sdk"

// Gutenberg-specific implementation contract requirements. They are scoped to
// independently established tags so generic React/TypeScript code is untouched.
export default definePlugin({
  id: "com.atheory-ai.wordpress-demo.gutenberg-conventions",
  name: "Gutenberg Conventions (Demo)",
  version: "0.6.0",
  claims: [
    { capability: "ce.policy.engineering.gutenberg/1", evidence_schema: "semantic-policy-pack/v1", coverage_profile: "gutenberg-policy/v1" },
  ],
  dependencies: {
    plugins: ["com.atheory-ai.typescript"],
  },
  semanticPolicies: {
    schemaVersion: "v1",
    languages: ["typescript", "javascript"],
    policies: [
      {
        id: "gutenberg-demo.block.metadata-registration",
        version: "v1",
        phase: "constrain",
        priority: 10,
        when: { allClaimKinds: ["context.gutenberg.block", "operation.block.register"] },
        severity: "error",
        add: {
          kind: "block.metadata",
          requirement: "define the block with block.json metadata and register the same metadata on the server and client unless the target explicitly supports a documented exception",
          mandatory: true,
        },
      },
      {
        id: "gutenberg-demo.block.editor-props",
        version: "v1",
        phase: "pre_generate",
        priority: 20,
        when: { allClaimKinds: ["context.gutenberg.block", "surface.gutenberg.editor"] },
        severity: "error",
        add: {
          kind: "editor.integration",
          requirement: "use the appropriate @wordpress/block-editor block-props API for editor/save markup so block supports and editor behavior remain connected",
          mandatory: true,
        },
      },
      {
        id: "gutenberg-demo.user-text.i18n",
        version: "v1",
        phase: "pre_generate",
        priority: 30,
        when: { allClaimKinds: ["context.gutenberg", "output.user_facing_text"] },
        severity: "error",
        add: {
          kind: "i18n",
          requirement: "wrap user-facing editor text with the appropriate @wordpress/i18n function and the package's established text-domain convention",
          mandatory: true,
        },
      },
      {
        id: "gutenberg-demo.editor-accessibility",
        version: "v1",
        phase: "constrain",
        priority: 40,
        when: { allClaimKinds: ["context.gutenberg", "surface.gutenberg.editor", "output.html"] },
        severity: "error",
        add: {
          kind: "accessibility",
          requirement: "preserve keyboard-operable controls, accessible names, focus behavior, and semantic markup for the editor interaction",
          mandatory: true,
        },
      },
      {
        id: "gutenberg-demo.package-boundary",
        version: "v1",
        phase: "verify",
        priority: 50,
        when: { claimKinds: ["context.gutenberg.package"] },
        severity: "warning",
        add: {
          kind: "architecture.boundary",
          requirement: "keep the package focused on one clear purpose and use public @wordpress package APIs rather than private or experimental APIs unless the target explicitly permits them",
          mandatory: true,
        },
      },
    ],
  },
})
