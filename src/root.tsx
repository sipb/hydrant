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
import {
  destroySession,
  FIREROAD_VERIFY_URL,
  getSession,
  SessionContext,
} from "./lib/auth";

// eslint-disable-next-line react-refresh/only-export-components
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
    <html lang="en">
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

// eslint-disable-next-line react-refresh/only-export-components
export async function clientLoader() {
  const session = await getSession(document.cookie);

  if (session.has("access_token")) {
    const response = await fetch(FIREROAD_VERIFY_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.get("access_token") ?? ""}`,
      },
    });

    if (!response.ok) {
      // token expired
      console.log("Token expired!");
      document.cookie = await destroySession(session);
      return { session: null };
    }
  }

  return { session };
}

export default function Root({ loaderData }: Route.ComponentProps) {
  return (
    <SessionContext value={loaderData.session}>
      <Outlet />
    </SessionContext>
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
