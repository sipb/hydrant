import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { Flex, Spinner, Text, Stack, Code } from "@chakra-ui/react";
import { withEmotionCache } from "@emotion/react";

import type { Route } from "./+types/root";

import { Provider } from "./components/ui/provider";
import { useInjectStyles } from "./emotion/emotion-client";
import "temporal-polyfill/global";

import "@fontsource-variable/ibm-plex-sans/index.css";
import "@fontsource/ibm-plex-mono/index.css";

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    type: "icon/png",
    href: import.meta.env.BASE_URL + "hydrant.png",
  },
];

export function HydrateFallback() {
  return (
    <Flex w="100%" h="100vh" align="center" justify="center">
      <Spinner />
    </Flex>
  );
}

function Analytics() {
  return (
    <>
      {/* Privacy-friendly analytics by Plausible */}
      <script
        async
        src="https://analytics.mit.edu/js/pa-gQ_B0WWR0n8I3ly4S-urO.js"
      ></script>
      <script>
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()`}
      </script>
    </>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
  return <LayoutWithCache {...props} />;
};

const LayoutWithCache = withEmotionCache((props: LayoutProps, cache) => {
  const { children } = props;

  useInjectStyles(cache);

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hydrant</title>
        <Meta />
        <Links />
        <meta
          name="emotion-insertion-point"
          content="emotion-insertion-point"
        />
        <Analytics />
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
