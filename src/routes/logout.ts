import { replace } from "react-router";

import { destroySession, getSession } from "../lib/auth";
// import type { Route } from "./+types/callback";


export async function clientLoader() {
  const session = await getSession(document.cookie);
  document.cookie = await destroySession(session);

  return replace("/");
}
