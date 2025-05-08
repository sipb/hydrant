import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/Index.tsx"),
  route("overrides/:prefillId?", "./routes/Overrides.tsx"),
  route("export", "./routes/export.ts"),
] satisfies RouteConfig;
