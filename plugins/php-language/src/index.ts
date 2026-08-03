import { definePlugin } from "@atheory-ai/ce-plugin-sdk"
import { extract } from "./extract.js"
import { match } from "./match.js"

export default definePlugin({
  id: "com.atheory-ai.wordpress-demo.php",
  name: "PHP Language (WordPress Demo)",
  version: "0.6.0",
  index: {
    phase: "file.extract",
    scope: "file",
    requires: ["artifact:source", "artifact:cst:php"],
    provides: ["language:php", "cst:php", "facts:php-structure", "references:php-file", "references:php-namespace", "calls:php-static", "mechanics:php:v1"],
  },
  language: {
    extensions: [".php", ".phtml"],
    grammar: "php-grammar.wasm",
    customMatch: true,
    match,
    extract,
  },
})
