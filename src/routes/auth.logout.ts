import { replace } from "react-router";

import { destroySession, getSession, safeNext } from "../lib/auth";
import type { Route } from "./+types/auth.logout";

export async function clientLoader({ url }: Route.ClientLoaderArgs) {
  const next = url.searchParams.get("next");

  const session = await getSession(document.cookie);
  document.cookie = await destroySession(session);

  return replace(safeNext(next));
}

clientLoader.hydrate = true as const;
