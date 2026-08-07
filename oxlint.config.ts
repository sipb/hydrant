import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "react", "unicorn", "import", "react-perf"],
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
    "no-unassigned-import": ["error", { allow: ["**/*.css"] }],
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
  },
  overrides: [
    {
      files: ["tests/**"],
      env: { vitest: true },

      plugins: ["vitest"],
    },
  ],
});
