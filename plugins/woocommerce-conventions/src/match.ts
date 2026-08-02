import type { LanguageDefinition } from "@atheory-ai/ce-plugin-sdk"

// A decorator must never accept a file its required PHP provider rejects.
// Keep this eligibility boundary identical to the PHP and WordPress plugins.
export const match: LanguageDefinition["match"] = (filePath) =>
  (filePath.endsWith(".php") || filePath.endsWith(".phtml")) &&
  !filePath.includes("/vendor/") &&
  !filePath.includes("/node_modules/") &&
  !filePath.includes("/build/")
