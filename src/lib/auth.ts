import { createContext } from "react";
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

export const SessionContext = createContext<Awaited<
  ReturnType<typeof getSession>
> | null>(null);

// API FUNCTION CALLS

export const getFavoriteCourses = async (authToken: string) => {
  const response = await fetch(`${FIREROAD_URL}/prefs/favorites/`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch favorite courses");
  }

  const result = (await response.json()) as
    | {
        success: false;
        error: string;
      }
    | { success: true; favorites: string[] };

  if (!result.success) {
    throw new Error("Failed to fetch favorite courses: " + result.error);
  }

  return result.favorites;
};

export const setFavoriteCourses = async (
  authToken: string,
  favorites: string[],
) => {
  const response = await fetch(`${FIREROAD_URL}/prefs/favorites/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(favorites),
  });

  if (!response.ok) {
    throw new Error("Failed to set favorite courses");
  }

  const result = (await response.json()) as
    | {
        success: false;
        error: string;
      }
    | { success: true };

  if (!result.success) {
    throw new Error("Failed to set favorite courses: " + result.error);
  }
};
