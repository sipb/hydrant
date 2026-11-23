import { createContext } from "react";
import { createCookieSessionStorage } from "react-router";

import type { DeflatedSave } from "./schema";

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
      // browsers ignore httpOnly cookies set from client
      httpOnly: false,
      secure: import.meta.env.PROD,
      // since app is client-side, secret would be in bundle...
      secrets: [],
    },
  });

const PENDING_LOGIN_KEY = "hydrant-pending-login";
/**login codes expire after 10 minutes */
const PENDING_LOGIN_TIMEOUT = 10 * 60 * 1000;

/** store login state and redirect after login */
export function startPendingLogin(next: string | null): void {
  sessionStorage.setItem(
    PENDING_LOGIN_KEY,
    JSON.stringify({ next, started: Date.now() }),
  );
}

/** rejects login codes from links that someone else made (login CSRF) */
export function finishPendingLogin(): string | undefined {
  const pending = sessionStorage.getItem(PENDING_LOGIN_KEY);
  sessionStorage.removeItem(PENDING_LOGIN_KEY);
  if (!pending) return undefined;
  try {
    const { next, started } = JSON.parse(pending) as {
      next: string | null;
      started: number;
    };
    const age = Date.now() - started;
    return age >= 0 && age < PENDING_LOGIN_TIMEOUT ? safeNext(next) : undefined;
  } catch {
    return undefined;
  }
}

export const SessionContext = createContext<Awaited<
  ReturnType<typeof getSession>
> | null>(null);

/** don't let redirect to external domains */
export const safeNext = (next: string | null) =>
  next?.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/";

/** fireroad sometimes uses error_msg instead of error... */
type FireroadError = { success: false } & (
  { error: string } | { error_msg: string }
);

/**
 * Call a Fireroad API, POSTing `body` as JSON if given. Throws `failure`, with
 * Fireroad's own message if there is one, when the request fails.
 */
async function fireroad<T>(
  authToken: string,
  path: string,
  failure: string,
  body?: unknown,
): Promise<T> {
  const headers = { Authorization: `Bearer ${authToken}` };
  const response = await fetch(
    `${FIREROAD_URL}${path}`,
    body === undefined
      ? { headers }
      : {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );

  if (!response.ok) {
    throw new Error(failure);
  }

  const result = (await response.json()) as
    FireroadError | ({ success: true } & T);
  if (!result.success) {
    const message = "error" in result ? result.error : result.error_msg;
    throw new Error(`${failure}: ${message}`);
  }

  return result;
}

export const getFavoriteCourses = async (authToken: string) =>
  (
    await fireroad<{ favorites: string[] }>(
      authToken,
      "/prefs/favorites/",
      "Failed to fetch favorite courses",
    )
  ).favorites;

export const setFavoriteCourses = async (
  authToken: string,
  favorites: string[],
) => {
  await fireroad(
    authToken,
    "/prefs/set_favorites/",
    "Failed to set favorite courses",
    favorites,
  );
};

// Fireroad sync protocol: https://github.com/sipb/fireroad-server/blob/master/sync/operations.py

/** "Custom" is only used by custom courses made in the old fireroad app */
type FireroadSectionKind =
  "Lecture" | "Recitation" | "Lab" | "Design" | "Custom";

/** hydrant-specific data, stored alongside the fireroad format. */
export interface HydrantScheduleData {
  /** Term urlName, e.g. "f26" */
  term: string;
  /** Name of the save in Hydrant, without the term suffix */
  name: string;
  /** Output of State.deflate(), missing until Hydrant first loads the file */
  state?: DeflatedSave;
}

export interface ScheduleContents {
  selectedSubjects: {
    subject_id: string;
    title: string;
    /** Total units; old app reads this as a number */
    units: number;
    /** Section indices the user allows, omitted by apps when unconstrained */
    allowedSections?: Partial<Record<FireroadSectionKind, number[]>>;
    /** Chosen section indices, omitted by apps before a schedule is picked */
    selectedSections?: Partial<Record<FireroadSectionKind, number>>;
  }[];
  hydrant?: HydrantScheduleData;
}

export interface RemoteScheduleFile {
  name: string;
  id: number;
  changed: string;
  downloaded: string;
  agent: string;
  contents: ScheduleContents;
}

/** get a summary of all schedules, keyed by id. */
export const getSchedules = async (authToken: string) =>
  (
    await fireroad<{
      files: Record<string, { name: string; changed: string; agent: string }>;
    }>(authToken, "/sync/schedules/", "Failed to fetch schedules")
  ).files;

/** get a single schedule, including contents. */
export const getSchedule = async (authToken: string, id: number) =>
  (
    await fireroad<{ file: RemoteScheduleFile }>(
      authToken,
      `/sync/schedules/?id=${id.toString()}`,
      "Failed to fetch schedule",
    )
  ).file;

export const deleteSchedule = async (authToken: string, id: number) => {
  await fireroad(
    authToken,
    "/sync/delete_schedule/",
    "Failed to delete schedule",
    {
      id,
    },
  );
};

export type SyncScheduleResult =
  | { result: "no_change"; changed: string }
  | {
      result: "update_remote";
      changed: string;
      /** id is only present when a new file was created */
      id?: number;
    }
  | {
      result: "update_local";
      contents: ScheduleContents;
      name: string;
      id: number;
      downloaded: string;
      changed: string;
    }
  | {
      result: "conflict";
      other_name: string;
      other_agent: string;
      other_date: string;
      /** empty if the remote file was deleted */
      other_contents: ScheduleContents | "";
      this_agent: string;
      this_date: string;
    };

export interface SyncScheduleOperation {
  /** Remote id; omit to create a new file */
  id?: number;
  name: string;
  contents: ScheduleContents;
  /** ISO time of the last local change */
  changed: string;
  /** ISO time of the last download, required for existing files */
  downloaded?: string;
  agent: string;
  override?: boolean;
}

export const syncSchedule = (
  authToken: string,
  operation: SyncScheduleOperation,
) =>
  fireroad<SyncScheduleResult>(
    authToken,
    "/sync/sync_schedule/",
    "Failed to sync schedule",
    operation,
  );
