/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.SUBDIR ?? undefined,
  plugins: [reactRouter()],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    tsconfigPaths: true,
  },
});
