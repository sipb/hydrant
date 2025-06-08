/* eslint-disable @typescript-eslint/only-throw-error */
import { data, replace } from "react-router";

import type { SessionData } from "../lib/auth";
import { commitSession, FIREROAD_FETCH_TOKEN_URL, getSession } from "../lib/auth";
import type { Route } from "./+types/callback";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    throw data(null, 400)
  }

  const fetch_token_url = new URL(FIREROAD_FETCH_TOKEN_URL);
  fetch_token_url.searchParams.set("code", code);

  try {
    const response = await fetch(fetch_token_url.toString());

    if (!response.ok) {
      // error fetching token
      throw data(null, 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const access_info = (await response.json()).access_info as SessionData;;

    const session = await getSession(document.cookie);

    session.set("academic_id", access_info.academic_id);
    session.set("access_token", access_info.access_token);
    session.set("current_semester", access_info.current_semester);
    session.set("success", access_info.success);
    session.set("username", access_info.username);
    console.log("Session data set", session.data);

    document.cookie = await commitSession(session);

    return replace("/");

  } catch {
    throw data(null, 500)
  }
}
