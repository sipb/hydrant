import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  // for now... https://remix.run/blog/rr-governance
  future: {
    unstable_middleware: true,
    unstable_splitRouteModules: true,
    unstable_subResourceIntegrity: true,
    unstable_viteEnvironmentApi: true,
    unstable_optimizeDeps: true,
  },
} satisfies Config;
