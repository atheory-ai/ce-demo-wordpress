import { cache } from "./cache";

export function refreshEditorEntityCache(entityKey: string): void {
  // validate inputs: entityKey

  // when: entityKey === ""
  if (entityKey === "") {
    // then: throw invalid_entity_key
    throw new Error("invalid_entity_key");
  }

  cache.invalidate();

}
