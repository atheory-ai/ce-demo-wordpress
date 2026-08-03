import { definePlugin } from "@atheory-ai/ce-plugin-sdk"
import { extract } from "./extract.js"
import { match } from "./match.js"

export default definePlugin({
  id: "com.atheory-ai.wordpress-demo.php",
  name: "PHP Language (WordPress Demo)",
  version: "0.6.0",
  claims: [
    { capability: "ce.language.declarations.php/1", evidence_schema: "graph-structure/v1", coverage_profile: "php-declarations/v1" },
    { capability: "ce.language.references.php/1", evidence_schema: "source-references/v1", coverage_profile: "php-references/v1" },
    { capability: "ce.language.calls.php/1", evidence_schema: "source-calls/v1", coverage_profile: "php-calls-static/v1" },
    { capability: "ce.language.mechanics.php/1", evidence_schema: "source-mechanics/v1", coverage_profile: "php-mechanics/v1" },
  ],
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
