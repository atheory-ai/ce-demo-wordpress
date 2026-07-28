export function refreshEditorEntityCache(entityKey: string): void {
  if (entityKey === "") {
    throw new Error("invalid_entity_key");
  }
}
