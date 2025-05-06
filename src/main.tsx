import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router";

const App = lazy(() => import("./components/App"));
const Overrides = lazy(() => import("./components/OverridesApp"));

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Suspense>
        <Routes>
          <Route index Component={App} />
          <Route path="overrides" Component={Overrides} />
        </Routes>
      </Suspense>
    </Router>
  </StrictMode>,
);
