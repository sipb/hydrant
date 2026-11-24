import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["oxc", "typescript", "react", "unicorn", "import", "jsx-a11y"],
  categories: {
    correctness: "error",
    suspicious: "warn",
  },
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: "error",
  },
  env: {
    builtin: true,
    es2023: true,
    browser: true,
  },
  ignorePatterns: ["src/components/ui/**", "src/emotion/**"],
  rules: {
    "react-in-jsx-scope": "off",
    "no-unassigned-import": [
      "error",
      { allow: ["**/*.css", "temporal-polyfill/global"] },
    ],
    "react/only-export-components": [
      "warn",
      {
        allowConstantExport: true,
        allowExportNames: [
          "middleware",
          "clientMiddleware",
          "loader",
          "clientLoader",
          "action",
          "clientAction",
          "headers",
          "handle",
          "links",
          "meta",
          "shouldRevalidate",
        ],
      },
    ],
    "react/rules-of-hooks": "error",
    "jsx-a11y/no-autofocus": "off",
    "jsx-a11y/prefer-tag-over-role": "warn",
  },
  overrides: [
    {
      files: ["tests/**"],
      env: { vitest: true },

      plugins: ["vitest"],
    },
  ],
});
