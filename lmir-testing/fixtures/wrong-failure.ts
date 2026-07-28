import { cache } from "./cache";

export function refreshEditorEntityCache(entityKey: string): void {
  if (entityKey === "") {
    throw new Error("entity_not_found");
  }

  cache.invalidate();
}
