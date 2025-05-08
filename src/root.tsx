import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";

import { Provider } from "./components/ui/provider";
import { Flex, Spinner, Text, Stack, Code } from "@chakra-ui/react";

import "@fontsource-variable/inter/index.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "icon/png", href: "/hydrant.png" },
];

export function HydrateFallback() {
  return (
    <Provider>
      <Flex w="100%" h="100vh" align="center" justify="center">
        <Spinner />
      </Flex>
    </Provider>
  );
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
  return (
    <Provider>
      <Outlet />
    </Provider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Provider>
      <Flex as="main" w="100%" h="100vh" align="center" justify="center">
        <Stack textAlign="center">
          <Text fontSize="2xl" fontWeight="bold">
            {message}
          </Text>
          <Text fontSize="lg">{details}</Text>
          {stack && (
            <pre
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Code>{stack}</Code>
            </pre>
          )}
        </Stack>
      </Flex>
    </Provider>
  );
}
