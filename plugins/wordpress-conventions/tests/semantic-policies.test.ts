import { describe, expect, it } from "vitest"
import plugin from "../src/index.js"

describe("semantic implementation policies", () => {
  it("uses composed semantic facts for platform safety requirements", () => {
    const pack = plugin.semanticPolicies
    expect(pack?.schemaVersion).toBe("v1")
    expect(pack?.languages).toEqual(["php"])
    const policies = pack?.policies ?? []
    expect(policies.find((policy) => policy.id === "wordpress-demo.request.csrf")?.when?.allClaimKinds).toEqual([
      "surface.wordpress.request",
      "operation.mutate",
    ])
    expect(policies.find((policy) => policy.id === "wordpress-demo.html.escape-late")?.when?.allClaimKinds).toEqual([
      "output.html",
      "input.user_controlled",
    ])
  })
})
