import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";

import "@fontsource-variable/inter/index.css";
import "@fontsource/roboto/index.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "icon/png", href: "/hydrant.png" },
];

export function HydrateFallback() {
  return <div></div>;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hydrant</title>
        <Meta />
        <Links />
        <script
          defer
          data-domain="hydrant.mit.edu"
          src="https://analytics.mit.edu/js/script.hash.outbound-links.tagged-events.js"
        ></script>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
