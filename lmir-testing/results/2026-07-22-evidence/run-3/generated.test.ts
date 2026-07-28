// Generated from IIR for refreshEditorEntityCache. Tests derive from declared intent, not code.
import { refreshEditorEntityCache } from "./refreshEditorEntityCache";

describe("refreshEditorEntityCache", () => {
  // iir: refreshEditorEntityCache.behavior[0]
  it("when entityKey === \"\" then throw invalid_entity_key", () => {
    // TODO: arrange inputs and assert the declared behavior
    expect(refreshEditorEntityCache).toBeDefined();
  });

  // iir: refreshEditorEntityCache.failureMode.invalid_entity_key
  it("fails with invalid_entity_key", () => {
    // TODO: exercise the failure path and assert the failure outcome
    expect(refreshEditorEntityCache).toBeDefined();
  });

  // iir: refreshEditorEntityCache.sideEffect.cache.invalidate
  it("performs side effect cache.invalidate", () => {
    // TODO: assert the side effect is performed
    expect(refreshEditorEntityCache).toBeDefined();
  });
});
