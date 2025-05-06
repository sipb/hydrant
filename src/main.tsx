import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    index: true,
    lazy: async () => ({
      Component: (await import("./components/App")).default,
    }),
  },
  {
    path: "overrides/:prefillId?",
    lazy: async () => {
      const overrides = await import("./components/OverridesApp");

      return {
        Component: overrides.Component,
        loader: overrides.loader,
      };
    },
  },
]);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
