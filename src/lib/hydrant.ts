import { createContext, useEffect, useRef, useState } from "react";
import { useColorMode } from "../components/ui/color-mode";

import type { TermInfo } from "../lib/dates";
import type { RawClass, RawPEClass } from "./raw";
import type { HydrantState } from "../lib/schema";
import { DEFAULT_STATE } from "../lib/schema";
import type { State } from "../lib/state";

export interface SemesterData {
  classes: Record<string, RawClass>;
  lastUpdated: string;
  termInfo: TermInfo;
  pe?: Record<number, Record<string, RawPEClass>>;
}

export const getStateMaps = (
  classes: SemesterData["classes"],
  pe?: SemesterData["pe"],
) => {
  const classesMap = new Map(Object.entries(classes));
  const peClassesMap = Object.entries(pe ?? {}).reduce<
    Record<number, Map<string, RawPEClass>>
  >((acc, [quarter, peClasses]) => {
    acc[Number(quarter)] = new Map(Object.entries(peClasses));
    return acc;
  }, {});

  return { classesMap, peClassesMap };
};

/** Fetch from the url, which is JSON of type T. */
export const fetchNoCache = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-cache" });
  return (await res.json()) as T;
};

/** Hook to fetch data and initialize State object. */
export function useHydrant({ globalState }: { globalState: State }): {
  state: State;
  hydrantState: HydrantState;
} {
  const stateRef = useRef<State>(globalState);

  const [hydrantState, setHydrantState] = useState<HydrantState>(DEFAULT_STATE);
  const { colorMode, setColorMode, toggleColorMode } = useColorMode();

  const state = stateRef.current;

  useEffect(() => {
    // if colorScheme changes, change colorMode to match
    state.callback = (newState: HydrantState) => {
      setHydrantState(newState);
      if (
        newState.preferences.colorScheme &&
        colorMode !== newState.preferences.colorScheme.colorMode
      ) {
        // if the color scheme is not null, set the color mode to match
        toggleColorMode();
      } else if (newState.preferences.colorScheme === null) {
        // if the color scheme is null, set the color mode to match the system
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setColorMode("dark");
        } else {
          setColorMode("light");
        }
      }
    };
    state.updateState();
  }, [colorMode, state]);

  return { state, hydrantState };
}

export const HydrantContext = createContext<ReturnType<typeof useHydrant>>({
  hydrantState: DEFAULT_STATE,
  state: {} as State,
});
