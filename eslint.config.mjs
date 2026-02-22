import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Explicit ignore for .aios-core and aios-core-main (legacy CommonJS layer)
  {
    ignores: [".aios-core/**", ".claude/hooks/**", "aios-core-main/**", ".next/**", "out/**", "build/**", "dist/**", "node_modules/**"],
  },
  // Disable problematic Next.js rule with route groups containing special characters
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
