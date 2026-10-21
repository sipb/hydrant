/* eslint-disable @typescript-eslint/only-throw-error */
import { data, replace } from "react-router";

import type { SessionData } from "../lib/auth";
import {
  commitSession,
  FIREROAD_FETCH_TOKEN_URL,
  getSession,
} from "../lib/auth";
import type { Route } from "./+types/auth.callback";

export async function clientLoader({ url }: Route.ClientLoaderArgs) {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (!code) {
    throw data(null, 400);
  }

  const fetchTokenURL = new URL(FIREROAD_FETCH_TOKEN_URL);
  fetchTokenURL.searchParams.set("code", code);

  try {
    const response = await fetch(fetchTokenURL.toString());

    if (!response.ok) {
      // error fetching token
      throw data(null, 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const accessInfo = (await response.json()).access_info as SessionData;

    const session = await getSession(document.cookie);

    session.set("academic_id", accessInfo.academic_id);
    session.set("access_token", accessInfo.access_token);
    session.set("current_semester", accessInfo.current_semester);
    session.set("success", accessInfo.success);
    session.set("username", accessInfo.username);
    console.log("Session data set", session.data);

    document.cookie = await commitSession(session);

    return replace(next ?? "/");
  } catch {
    throw data(null, 500);
  }
}

clientLoader.hydrate = true as const;
