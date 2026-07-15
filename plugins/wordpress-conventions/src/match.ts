import type { LanguageDefinition } from "@atheory-ai/ce-plugin-sdk"

export const match: LanguageDefinition["match"] = (filePath) =>
  (filePath.endsWith(".php") || filePath.endsWith(".phtml")) &&
  !filePath.includes("/vendor/") &&
  !filePath.includes("/node_modules/") &&
  !filePath.includes("/build/")
