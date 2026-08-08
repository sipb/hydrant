import { defineConfig } from "oxfmt";

// uses .editorconfig by default, no need to customize much
export default defineConfig({
  ignorePatterns: ["public/*"],
  sortImports: {
    newlinesBetween: true,
    customGroups: [
      {
        groupName: "react-libs",
        elementNamePattern: ["react", "react-**"],
      },
    ],
    groups: [
      "react-libs",
      "type-import",
      ["value-builtin", "value-external"],
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "style",
      "unknown",
    ],
  },
  sortPackageJson: { sortScripts: true },
});
