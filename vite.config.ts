/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import checker from "vite-plugin-checker";
import babel from "vite-plugin-babel";

const ReactCompilerConfig = {
  /* ... */
};

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.SUBDIR ?? undefined,
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [
          ["babel-plugin-react-compiler", ReactCompilerConfig],
          ["@babel/plugin-transform-typescript", { allowDeclareFields: true }],
        ],
      },
    }),
    checker({
      typescript: true,
      eslint: { lintCommand: "eslint .", useFlatConfig: true },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
