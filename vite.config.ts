/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
// import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.SUBDIR ?? undefined,
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    // !process.env.VITEST
    //   ? checker({
    //       typescript: true,
    //       eslint: { lintCommand: "eslint .", useFlatConfig: true },
    //     })
    //   : null,
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
