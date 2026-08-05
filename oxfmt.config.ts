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
      ["value-builtin", "value-external"],
      "value-internal",
      ["value-parent", "value-sibling", "value-index"],
      "unknown",
    ],
  },
  sortPackageJson: { sortScripts: true },
});
