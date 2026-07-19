import { definePlugin } from "@atheory-ai/ce-plugin-sdk"
import { extract } from "./extract.js"
import { match } from "./match.js"

export default definePlugin({
  id: "com.atheory-ai.wordpress-demo.php",
  name: "PHP Language (WordPress Demo)",
  version: "0.1.0",
	provides: ["language:php", "cst:php", "facts:php-structure"],
  language: {
    extensions: [".php", ".phtml"],
    grammar: "php-grammar.wasm",
    match,
    extract,
  },
})
