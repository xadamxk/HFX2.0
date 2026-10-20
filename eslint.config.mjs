// @ts-check
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["dist/", "coverage/", "node_modules/", "extension/"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: [
      "config/**/*.ts",
      "templates/**/*.ts",
      "*.{js,mjs,ts}",
      "**/*.test.{ts,tsx}",
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    // Node scripts (webpack config, templates, jest config) use CommonJS requires
    files: ["config/**/*.ts", "templates/**/*.ts", "jest.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Existing code predates linting: report these as warnings so they can be
    // cleaned up gradually without blocking CI. New errors still fail the lint.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-unsafe-declaration-merging": "warn",
      "no-empty": "warn",
      "no-var": "warn",
      "prefer-const": "warn",
    },
  },
  // Formatting is Prettier's job; turn off rules that conflict with it
  prettier
);
