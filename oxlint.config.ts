import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "react", "unicorn", "import"],
  categories: {
    correctness: "error",
    suspicious: "warn",
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  env: {
    builtin: true,
    es2022: true,
    browser: true,
  },
  rules: {
    "react-in-jsx-scope": "off",
    "no-unassigned-import": ["error", { allow: ["**/*.css"] }],
  },
  overrides: [
    {
      files: ["tests/**"],
      globals: {
        suite: "writable",
        test: "writable",
        describe: "writable",
        it: "writable",
        expectTypeOf: "writable",
        assertType: "writable",
        expect: "writable",
        assert: "writable",
        chai: "writable",
        vitest: "writable",
        vi: "writable",
        beforeAll: "writable",
        afterAll: "writable",
        beforeEach: "writable",
        afterEach: "writable",
        onTestFailed: "writable",
        onTestFinished: "writable",
      },
      plugins: ["vitest"],
    },
  ],
});
