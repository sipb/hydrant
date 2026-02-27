import { redirect } from "react-router";
import { FIREROAD_LOGIN_URL } from "../lib/auth";

import type { Route } from "./+types/auth.login";

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const authorizationURL = new URL(FIREROAD_LOGIN_URL);

  const currentUrl = new URL(request.url);
  const callbackUrl = new URL(
    "/auth/callback" + currentUrl.search,
    currentUrl.origin,
  );

  authorizationURL.searchParams.set("redirect", callbackUrl.toString());

  return redirect(authorizationURL.toString());
}

clientLoader.hydrate = true as const;
