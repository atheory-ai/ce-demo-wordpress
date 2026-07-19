import { definePlugin } from "@atheory-ai/ce-plugin-sdk"
import { extract } from "./extract.js"
import { match } from "./match.js"

export default definePlugin({
  id: "com.atheory-ai.wordpress-demo.conventions",
  name: "WordPress & WooCommerce Conventions (Demo)",
  version: "0.1.0",
	requires: ["cst:php", "facts:php-structure"],
	enriches: ["php"],
  language: {
    // PHP Language owns parsing and declares php-grammar.wasm. This additive
    // plugin receives that same CST and contributes only framework facts.
    extensions: [".php", ".phtml"],
    match,
    extract,
  },
})
