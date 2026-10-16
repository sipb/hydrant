import { replace } from "react-router";

import { destroySession, getSession } from "../lib/auth";
import type { Route } from "./+types/auth.callback";

export async function clientLoader({ url }: Route.ClientLoaderArgs) {
  const next = url.searchParams.get("next");

  const session = await getSession(document.cookie);
  document.cookie = await destroySession(session);

  return replace(next ?? "/");
}

clientLoader.hydrate = true as const;
