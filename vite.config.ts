/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";

const ReactCompilerConfig = {
  /* ... */
};

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.SUBDIR ?? undefined,
  plugins: [
    reactRouter(),
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
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    tsconfigPaths: true,
  },
});
