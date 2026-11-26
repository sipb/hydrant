import { redirect } from "react-router";
import { FIREROAD_LOGIN_URL, startPendingLogin } from "../lib/auth";

import type { Route } from "./+types/auth.login";

export function clientLoader({ url }: Route.ClientLoaderArgs) {
  const authorizationURL = new URL(FIREROAD_LOGIN_URL);
  const callbackUrl = new URL("/auth/callback", url.origin);

  startPendingLogin(url.searchParams.get("next"));
  authorizationURL.searchParams.set("redirect", callbackUrl.toString());

  return redirect(authorizationURL.toString());
}

clientLoader.hydrate = true as const;
