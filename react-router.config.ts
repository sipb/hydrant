import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  // change if deploying to a subdirectory
  basename: process.env.SUBDIR ?? "/",
} satisfies Config;
