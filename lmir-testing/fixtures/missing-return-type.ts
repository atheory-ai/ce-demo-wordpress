import { cache } from "./cache";

export function refreshEditorEntityCache(entityKey: string) {
  if (entityKey === "") {
    throw new Error("invalid_entity_key");
  }

  cache.invalidate();
}
