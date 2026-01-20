/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
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
