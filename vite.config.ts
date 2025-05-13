import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import checker from "vite-plugin-checker";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    nodePolyfills({ include: ["buffer"] }),
    checker({
      typescript: true,
      eslint: { lintCommand: "eslint **/*.{ts,tsx}", useFlatConfig: true },
    }),
  ],
});
