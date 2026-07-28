import { describe, expect, it } from "vitest"
import plugin from "../src/index.js"

describe("Gutenberg semantic policies", () => {
  it("keeps block metadata and editor accessibility requirements narrowly scoped", () => {
    const policies = plugin.semanticPolicies?.policies ?? []
    expect(policies.find((policy) => policy.id === "gutenberg-demo.block.metadata-registration")?.when?.allClaimKinds).toEqual([
      "context.gutenberg.block",
      "operation.block.register",
    ])
    expect(policies.find((policy) => policy.id === "gutenberg-demo.editor-accessibility")?.when?.allClaimKinds).toEqual([
      "context.gutenberg",
      "surface.gutenberg.editor",
      "output.html",
    ])
  })
})
