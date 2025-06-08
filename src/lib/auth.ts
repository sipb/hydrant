import { createCookieSessionStorage } from "react-router";

// https://pilcrowonpaper.com/blog/oauth-guide/

export const FIREROAD_URL = import.meta.env.DEV
  ? "https://fireroad-dev.mit.edu"
  : "https://fireroad.mit.edu";

export const FIREROAD_LOGIN_URL = `${FIREROAD_URL}/login`;
export const FIREROAD_FETCH_TOKEN_URL = `${FIREROAD_URL}/fetch_token`;
export const FIREROAD_VERIFY_URL = `${FIREROAD_URL}/verify/`;

export interface SessionData {
  academic_id: string;
  access_token: string;
  current_semester: number;
  success: boolean;
  username: string;
}

export interface SessionFlashData {
  error: string;
}

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",
      path: "/",
      sameSite: "lax",
      secure: import.meta.env.PROD,
      secrets: ["secret:3"],
    },
  });
