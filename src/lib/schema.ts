import type { Activity } from "./activity";
import type { ColorScheme, DecorationScheme } from "./colors";
import { COLOR_SCHEME_PRESETS, DECORATION_SCHEME_PRESETS } from "./colors";

/** A save has an ID and a name. */
export interface Save {
  id: string;
  name: string;
}

/** Browser-specific user preferences. */
export interface Preferences {
  colorScheme: ColorScheme;
  decoScheme: DecorationScheme;
  roundedCorners: boolean;
  showEventTimes: boolean;
  defaultScheduleId: string | null;
  showFeedback: boolean;
}

export function ensurePreferencesValid(
  prefs: Partial<Preferences>,
): Preferences {
  return {
    colorScheme:
      COLOR_SCHEME_PRESETS.find((v) => v.id === prefs.colorScheme?.id) ??
      COLOR_SCHEME_PRESETS.find((v) => v.name === prefs.colorScheme?.name) ??
      DEFAULT_PREFERENCES.colorScheme,
    decoScheme:
      DECORATION_SCHEME_PRESETS.find((v) => v.id === prefs.decoScheme?.id) ??
      DECORATION_SCHEME_PRESETS.find(
        (v) => v.name === prefs.decoScheme?.name,
      ) ??
      DEFAULT_PREFERENCES.decoScheme,
    roundedCorners:
      typeof prefs.roundedCorners == "boolean"
        ? prefs.roundedCorners
        : DEFAULT_PREFERENCES.roundedCorners,
    showEventTimes:
      typeof prefs.showEventTimes == "boolean"
        ? prefs.showEventTimes
        : DEFAULT_PREFERENCES.showEventTimes,
    defaultScheduleId:
      typeof prefs.defaultScheduleId == "number"
        ? prefs.defaultScheduleId
        : DEFAULT_PREFERENCES.defaultScheduleId,
    showFeedback:
      typeof prefs.showFeedback == "boolean"
        ? prefs.showFeedback
        : DEFAULT_PREFERENCES.showFeedback,
  };
}

/** The default user preferences. */
export const DEFAULT_PREFERENCES: Preferences = {
  colorScheme: COLOR_SCHEME_PRESETS[0],
  decoScheme: DECORATION_SCHEME_PRESETS[0],
  roundedCorners: false,
  showEventTimes: false,
  defaultScheduleId: null,
  showFeedback: true,
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
