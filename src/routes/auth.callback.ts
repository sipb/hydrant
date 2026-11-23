/* eslint-disable @typescript-eslint/only-throw-error */
import { data, replace } from "react-router";

import type { SessionData } from "../lib/auth";
import {
  commitSession,
  FIREROAD_FETCH_TOKEN_URL,
  finishPendingLogin,
  getSession,
} from "../lib/auth";
import type { Route } from "./+types/auth.callback";

export async function clientLoader({ url }: Route.ClientLoaderArgs) {
  const code = url.searchParams.get("code");
  const next = finishPendingLogin();

  // reject codes from logins this tab didn't start
  if (next === undefined || !code) {
    throw data(null, 400);
  }

  const fetchTokenURL = new URL(FIREROAD_FETCH_TOKEN_URL);
  fetchTokenURL.searchParams.set("code", code);

  let response: Response;
  let accessInfo: SessionData;
  try {
    response = await fetch(fetchTokenURL.toString());
    accessInfo = ((await response.json()) as { access_info: SessionData })
      .access_info;
  } catch {
    // network or parse failure
    throw data(null, 500);
  }

  if (!response.ok) {
    throw data(null, 400);
  }

  const session = await getSession(document.cookie);

  session.set("academic_id", accessInfo.academic_id);
  session.set("access_token", accessInfo.access_token);
  session.set("current_semester", accessInfo.current_semester);
  session.set("success", accessInfo.success);
  session.set("username", accessInfo.username);

  document.cookie = await commitSession(session);

  return replace(next);
}

clientLoader.hydrate = true as const;
