import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./components/App.tsx"),
  route("overrides/:prefillId?", "./components/OverridesApp.tsx"),
] satisfies RouteConfig;
