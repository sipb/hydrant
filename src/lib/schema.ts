import type {
  Activity,
  DeflatedClass,
  DeflatedCustomActivity,
} from "./activity";
import type { ColorScheme } from "./colors";
import type { MeasurementSystem } from "./measurement";

import "temporal-polyfill/global";

export enum ClassType {
  ACADEMIC = "Academic",
  PEW = "PE & Wellness",
}

/** The date the content of the banner was last changed. */
export const BANNER_LAST_CHANGED = Temporal.Instant.from(
  "2026-10-05T23:00:00Z",
).epochMilliseconds;
export const BANNER_MESSAGE =
  "PE&W subjects for Q2 registration are now available.";

/** A saved schedule. Older saves can lack the selected option and PE classes. */
export type DeflatedSave = [
  classes: DeflatedClass[],
  customActivities: DeflatedCustomActivity[] | null,
  selectedOption?: number,
  peClasses?: DeflatedClass[],
];

/** A save has an ID and a name. */
export interface Save {
  id: string;
  name: string;
  /** ISO time this save was last changed locally, used for Fireroad sync. */
  changed?: string;
  /** The Fireroad copy of this save, if it has been synced. */
  remote?: {
    /** Fireroad file id */
    id: number;
    /** Fireroad username that owns the file */
    user: string;
    /** ISO time this save was last downloaded from Fireroad */
    downloaded: string;
  };
}

/** A Fireroad schedule from another client, with no term saved in it. */
export interface UntaggedSchedule {
  /** Fireroad file id */
  remoteId: number;
  name: string;
  /** ISO time the schedule was last changed */
  changed: string;
  /** Subject numbers, to help tell schedules apart */
  subjects: string[];
}

/** Which copy to keep when resolving a {@link SyncConflict}. */
export type SyncConflictChoice = "local" | "remote" | "both";

/** A save that was changed both here and on Fireroad. */
export interface SyncConflict {
  saveId: string;
  saveName: string;
  /** Device that last changed the Fireroad copy */
  otherAgent: string;
  /** ISO time the Fireroad copy was last changed */
  otherDate: string;
  /** Whether the Fireroad copy was deleted */
  deleted: boolean;
}

/** Browser-specific user preferences. */
export interface Preferences {
  colorScheme: ColorScheme | null;
  roundedCorners: boolean;
  showEventTimes: boolean;
  defaultScheduleId: string | null;
  showBanner: boolean;
  showBannerChanged?: number;
  measurementSystem: MeasurementSystem | null;
}

/** The default user preferences. */
export const DEFAULT_PREFERENCES: Preferences = {
  colorScheme: null,
  roundedCorners: false,
  showEventTimes: false,
  defaultScheduleId: null,
  showBanner: true,
  showBannerChanged: undefined,
  measurementSystem: null,
};

/** React state. */
export interface HydrantState {
  selectedActivities: Activity[];
  viewedActivity: Activity | undefined;
  selectedOption: number;
  totalOptions: number;
  units: number;
  hours: number;
  warnings: string[];
  saveId: string;
  saves: Save[];
  preferences: Preferences;
  syncConflict: SyncConflict | undefined;
  untaggedSchedules: UntaggedSchedule[];
}

/** Default React state. */
export const DEFAULT_STATE: HydrantState = {
  selectedActivities: [],
  viewedActivity: undefined,
  selectedOption: 0,
  totalOptions: 0,
  units: 0,
  hours: 0,
  warnings: [],
  saveId: "",
  saves: [],
  preferences: DEFAULT_PREFERENCES,
  syncConflict: undefined,
  untaggedSchedules: [],
};
