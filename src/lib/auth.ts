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
      httpOnly: import.meta.env.PROD,
      secure: import.meta.env.PROD,
      // since we don't send auth cookies to a server (since its all client-side), we don't need to sign them
      secrets: [],
    },
  });

export const SessionContext = createContext<Awaited<
  ReturnType<typeof getSession>
> | null>(null);

// API FUNCTION CALLS

type GetFavoriteResponse =
  | {
      success: false;
      error: string;
    }
  | { success: true; favorites: string[] };

export const getFavoriteCourses = async (authToken: string) => {
  const response = await fetch(`${FIREROAD_URL}/prefs/favorites/`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch favorite courses");
  }

  const result = (await response.json()) as GetFavoriteResponse;
  if (!result.success) {
    throw new Error("Failed to fetch favorite courses: " + result.error);
  }

  return result.favorites;
};

type SetFavoriteResponse =
  | {
      success: false;
      error: string;
    }
  | { success: true };

export const setFavoriteCourses = async (
  authToken: string,
  favorites: string[],
) => {
  const response = await fetch(`${FIREROAD_URL}/prefs/set_favorites/`, {
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

  const result = (await response.json()) as SetFavoriteResponse;
  if (!result.success) {
    throw new Error("Failed to set favorite courses: " + result.error);
  }
};

interface ScheduleContents {
  selectedSubjects: {
    units: string;
    subject_id: string;
    title: string;
    allowedSections: {
      Lecture?: number[];
      Recitation?: number[];
      Lab?: number[];
      Design?: number[];
    };
    selectedSections: {
      Lecture?: number;
      Recitation?: number;
      Lab?: number;
      Design?: number;
    };
  }[];
}

type GetSchedulesWithIdResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      file: {
        name: string;
        id: string;
        changed: string;
        downloaded: string;
        agent: string;
        contents: ScheduleContents;
      };
    };

type GetSchedulesWithoutIdResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      files: Record<string, { name: string; changed: string; agent: string }>;
    };

export const getSchedules = async (authToken: string, id?: string) => {
  const response = await fetch(
    `${FIREROAD_URL}/sync/schedules/${id ? `?id=${id}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch schedules");
  }

  if (typeof id == "string") {
    // id specified, return single schedule
    const result = (await response.json()) as GetSchedulesWithIdResult;
    if (!result.success) {
      throw new Error("Failed to fetch schedule: " + result.error);
    }

    return result.file;
  } else {
    // no id specified, return all schedules
    const result = (await response.json()) as GetSchedulesWithoutIdResult;
    if (!result.success) {
      throw new Error("Failed to fetch schedules: " + result.error);
    }

    return result.files;
  }
};

type DeleteScheduleResult =
  | {
      success: false;
      error: string;
    }
  | { success: true };

export const deleteSchedule = async (authToken: string, id: string) => {
  const response = await fetch(`${FIREROAD_URL}/delete_schedule/`, {
    method: "POST",
    body: JSON.stringify({ id }),
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete schedule");
  }

  const result = (await response.json()) as DeleteScheduleResult;
  return result;
};

type SyncScheduleResult =
  | {
      success: false;
      error: string;
    }
  | { success: true; result: "no_change"; changed: string }
  | { success: true; result: "update_remote"; changed: string }
  | {
      success: true;
      result: "update_local";
      contents: ScheduleContents;
      name: string;
      id: string;
      downloaded: string;
    }
  | {
      success: true;
      result: "conflict";
      other_name: string;
      other_agent: string;
      other_date: string;
      other_contents: ScheduleContents | "";
      this_agent: string;
      this_date: string;
    };

export const syncSchedule = async (
  authToken: string,
  id: string,
  contents: ScheduleContents,
  changed: string,
  downloaded?: string,
  name?: string,
  agent?: string,
  override?: boolean,
) => {
  const response = await fetch(`${FIREROAD_URL}/sync_schedule/`, {
    method: "POST",
    body: JSON.stringify({
      id,
      contents,
      changed,
      downloaded,
      name,
      agent,
      override,
    }),
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to sync schedule");
  }

  const result = (await response.json()) as SyncScheduleResult;
  if (!result.success) {
    throw new Error("Failed to sync schedule: " + result.error);
  }

  return result;
};
