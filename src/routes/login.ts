import { redirect } from "react-router";
import { FIREROAD_LOGIN_URL } from "../lib/auth";

import type { Route } from "./+types/login";

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const authorizationURL = new URL(FIREROAD_LOGIN_URL);

  const currentUrl = new URL(request.url);
  const callbackUrl = new URL(currentUrl.origin + "/callback");

  authorizationURL.searchParams.set("redirect", callbackUrl.toString());

  return redirect(authorizationURL.toString());
}
