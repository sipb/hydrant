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
import { Flex, Spinner, Text, Stack, Code, Link } from "@chakra-ui/react";

import "@fontsource-variable/ibm-plex-sans/index.css";
import "@fontsource/ibm-plex-mono/index.css";

import "temporal-polyfill/global";

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    type: "icon/png",
    href: import.meta.env.BASE_URL + "hydrant.png",
  },
];

export function HydrateFallback() {
  return (
    <Flex
      w="100%"
      h="100dvh"
      direction="column"
      align="center"
      justify="center"
      gap={3}
    >
      <Spinner aria-hidden="true" />
      <Text role="status" color="fg.muted">
        Loading Hydrant data...
      </Text>
    </Flex>
  );
}

interface LayoutProps {
  children: React.ReactNode;
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

// eslint-disable-next-line react-refresh/only-export-components
export const Layout = withEmotionCache((props: LayoutProps, cache) => {
  const { children } = props;

  useInjectStyles(cache);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hydrant</title>
        <Meta />
        <Links />
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
  let message = "Hydrant couldn't load";
  let details =
    "The subject data may have failed to download. Check your connection and reload the page. If it keeps happening, email sipb-hydrant@mit.edu.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Page not found" : message;
    details =
      error.status === 404
        ? "There's no Hydrant page at this address."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Flex
      as="main"
      w="100%"
      minH="100dvh"
      align="center"
      justify="center"
      p={4}
    >
      <Stack textAlign="center" maxW="40em">
        <Text fontSize="2xl" fontWeight="bold">
          {message}
        </Text>
        <Text fontSize="lg">{details}</Text>
        <Link href={import.meta.env.BASE_URL} alignSelf="center">
          Go to Hydrant
        </Link>
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
