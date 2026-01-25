import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";

import { withEmotionCache } from "@emotion/react";
import { useInjectStyles } from "./emotion/emotion-client";

import { Provider } from "./components/ui/provider";
import { Flex, Spinner, Text, Stack, Code } from "@chakra-ui/react";

import "@fontsource-variable/inter/index.css";

// eslint-disable-next-line react-refresh/only-export-components
export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "icon/png", href: "/hydrant.png" },
];

export function HydrateFallback() {
  return (
    <Flex w="100%" h="100vh" align="center" justify="center">
      <Spinner />
    </Flex>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = withEmotionCache((props: LayoutProps, cache) => {
  const { children } = props;

  useInjectStyles(cache);

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
        <Provider>
          {children}
          <ScrollRestoration />
          <Scripts />
        </Provider>
      </body>
    </html>
  );
});

export default function Root() {
  return <Outlet />;
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
  );
}
