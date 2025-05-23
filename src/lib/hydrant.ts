import { useEffect, useRef, useState, createContext } from "react";
import { useColorMode } from "../components/ui/color-mode";

import type { TermInfo } from "../lib/dates";
import type { State } from "../lib/state";
import type { RawClass } from "../lib/rawClass";
import type { HydrantState } from "../lib/schema";
import { DEFAULT_STATE } from "../lib/schema";

export interface SemesterData {
  classes: Record<string, RawClass>;
  lastUpdated: string;
  termInfo: TermInfo;
}

/** Fetch from the url, which is JSON of type T. */
export const fetchNoCache = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-cache" });
  return (await res.json()) as T;
};

/** Hook to fetch data and initialize State object. */
export function useHydrant({ hydrantState }: { hydrantState: State }): {
  hydrant: State;
  state: HydrantState;
} {
  const hydrantRef = useRef<State>(hydrantState);

  const [state, setState] = useState<HydrantState>(DEFAULT_STATE);
  const { colorMode, setColorMode, toggleColorMode } = useColorMode();

  const hydrant = hydrantRef.current;

  useEffect(() => {
    // if colorScheme changes, change colorMode to match
    hydrant.callback = (newState: HydrantState) => {
      setState(newState);
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
    hydrant.updateState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorMode, hydrant]);

  return { hydrant, state };
}

export const HydrantContext = createContext<ReturnType<typeof useHydrant>>({
  state: DEFAULT_STATE,
  hydrant: {} as State,
});
