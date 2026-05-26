import { replace } from "react-router";

import { destroySession, getSession } from "../lib/auth";
import type { Route } from "./+types/auth.callback";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");

  const session = await getSession(document.cookie);
  document.cookie = await destroySession(session);

  return replace(next ?? "/");
}

clientLoader.hydrate = true as const;
