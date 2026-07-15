import type { LanguageDefinition } from "@atheory-ai/ce-plugin-sdk"

const EXTENSIONS = new Set([".php", ".phtml"])

export const match: LanguageDefinition["match"] = (filePath) => {
  const extension = filePath.slice(filePath.lastIndexOf("."))
  return EXTENSIONS.has(extension) &&
    !filePath.includes("/vendor/") &&
    !filePath.includes("/node_modules/") &&
    !filePath.includes("/build/")
}
