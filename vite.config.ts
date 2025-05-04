import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import checker from "vite-plugin-checker";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    nodePolyfills({ include: ["buffer"] }),
    checker({
      typescript: true,
      eslint: { lintCommand: "eslint **/*.{ts,tsx}", useFlatConfig: true },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        overrides: resolve(__dirname, "overrides/index.html"),
      },
    },
  },
});
