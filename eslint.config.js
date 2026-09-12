import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "reports", ".stryker-tmp", "node_modules", "playwright-report", "test-results"] },
  {
    files: ["src/**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      complexity: ["error", 4],
      "max-lines-per-function": ["error", { max: 40, skipBlankLines: true }],
      "max-depth": ["error", 3],
      "max-params": ["error", 3],
      "no-warning-comments": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    files: ["src/scenes/**/*.ts"],
    rules: {
      complexity: ["error", 1],
    },
  },
);
