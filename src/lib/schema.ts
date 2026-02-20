import type { Activity } from "./activity";
import type { ColorScheme } from "./colors";
import type { MeasurementSystem } from "./measurement";

export enum ClassType {
  ACADEMIC = "Academic",
  PEW = "PE & Wellness",
}

/** The date the content of the banner was last changed. */
export const BANNER_LAST_CHANGED = Temporal.Instant.from(
  "2026-01-23T12:00:00Z",
).epochMilliseconds;
export const BANNER_MESSAGE =
  "Q3 Physical Education and Wellness classes are now available on Hydrant! Registration opens Jan 30 on the PE&W website.";

/** A save has an ID and a name. */
export interface Save {
  id: string;
  name: string;
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
};
