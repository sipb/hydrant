import { createContext, useContext, useEffect, useState } from "react";

import type { TermInfo } from "../lib/dates";
import type { HydrantState } from "../lib/schema";
import type { State } from "../lib/state";
import type { RawClass, RawPEClass, BuildingInfo } from "./raw";

import { useColorMode } from "../components/ui/color-mode";
import { DEFAULT_STATE } from "../lib/schema";

export interface SemesterData {
  classes: Record<string, RawClass>;
  lastUpdated: string;
  termInfo: TermInfo;
  pe?: Record<number, Record<string, RawPEClass>>;
  locations?: Record<string, BuildingInfo>;
}

export const getStateMaps = (
  classes: SemesterData["classes"],
  pe?: SemesterData["pe"],
  locations?: SemesterData["locations"],
) => {
  const classesMap = new Map(Object.entries(classes));
  const peClassesMap = Object.entries(pe ?? {}).reduce<
    Record<number, Map<string, RawPEClass>>
  >((acc, [quarter, peClasses]) => {
    acc[Number(quarter)] = new Map(Object.entries(peClasses));
    return acc;
  }, {});
  const locationsMap = new Map(Object.entries(locations ?? {}));

  return { classesMap, peClassesMap, locationsMap };
};

/** Fetch from the url, which is JSON of type T. */
export const fetchNoCache = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-cache" });
  return await res.json();
};

/** Hook to fetch data and initialize State object. */
export function useHydrant({ globalState }: { globalState: State }): {
  state: State;
  hydrantState: HydrantState;
} {
  const [state] = useState(globalState);

  const [hydrantState, setHydrantState] = useState(DEFAULT_STATE);
  const { colorMode, setColorMode } = useColorMode();

  useEffect(() => {
    // if colorScheme changes, change colorMode to match
    state.setCallback((newState: HydrantState) => {
      setHydrantState(newState);
      const { colorScheme } = newState.preferences;
      if (colorScheme && colorMode !== colorScheme.colorMode) {
        // if the color scheme is not null, set the color mode to match
        setColorMode(colorScheme.colorMode);
      } else if (colorScheme === null) {
        // if the color scheme is null, set the color mode to match the system
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setColorMode("dark");
        } else {
          setColorMode("light");
        }
      }
    });
    state.updateState();
  }, [colorMode, state, setColorMode]);

  return { state, hydrantState };
}

export const HydrantContext = createContext<{
  hydrantState: HydrantState;
  state: State;
} | null>(null);

export const useHydrantContext = () => {
  const context = useContext(HydrantContext);
  if (!context) {
    throw new Error("useHydrantContext must be used within HydrantContext");
  }

  return context;
};
