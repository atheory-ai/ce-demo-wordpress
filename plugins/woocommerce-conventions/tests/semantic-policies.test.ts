import { describe, expect, it } from "vitest"
import plugin from "../src/index.js"

describe("WooCommerce semantic policies", () => {
  it("requires composed cart facts before adding cart-mutation requirements", () => {
    const policies = plugin.semanticPolicies?.policies ?? []
    const cartApi = policies.find((policy) => policy.id === "woocommerce-demo.cart.use-cart-api")
    const validation = policies.find((policy) => policy.id === "woocommerce-demo.cart.validate-request")
    expect(cartApi?.when?.allClaimKinds).toEqual(["context.woocommerce.cart", "operation.cart.modify"])
    expect(validation?.when?.allClaimKinds).toEqual(["context.woocommerce.cart", "operation.cart.modify", "input.user_controlled"])
  })
})
