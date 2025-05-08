import { useEffect, useRef, useState } from "react";
import { useColorMode } from "../components/ui/color-mode";

import type { LatestTermInfo, TermInfo } from "../lib/dates";
import { Term, getClosestUrlName } from "../lib/dates";
import { State } from "../lib/state";
import type { RawClass } from "../lib/rawClass";
import type { HydrantState } from "../lib/schema";
import { DEFAULT_STATE } from "../lib/schema";

export interface SemesterData {
  classes: Record<string, RawClass>;
  lastUpdated: string;
  termInfo: TermInfo;
}

/** Fetch from the url, which is JSON of type T. */
export const fetchNoCache = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-cache" });
  return (await res.json()) as T;
};

/** Hook to fetch data and initialize State object. */
export function useHydrant(): {
  hydrant?: State;
  state: HydrantState;
} {
  const [loading, setLoading] = useState(true);
  const hydrantRef = useRef<State>(undefined);
  const hydrant = hydrantRef.current;

  const [state, setState] = useState<HydrantState>(DEFAULT_STATE);

  useEffect(() => {
    const fetchData = async () => {
      const latestTerm = await fetchNoCache<LatestTermInfo>("/latestTerm.json");
      const params = new URLSearchParams(document.location.search);

      const urlNameOrig = params.get("t");
      const { urlName, shouldWarn } = getClosestUrlName(
        urlNameOrig,
        latestTerm.semester.urlName,
      );

      if (urlName === urlNameOrig || urlNameOrig === null) {
        const term =
          urlName === latestTerm.semester.urlName ? "latest" : urlName;
        const { classes, lastUpdated, termInfo } =
          await fetchNoCache<SemesterData>(`/${term}.json`);
        const classesMap = new Map(Object.entries(classes));
        const hydrantObj = new State(
          classesMap,
          new Term(termInfo),
          lastUpdated,
          latestTerm.semester.urlName,
        );
        hydrantRef.current = hydrantObj;
        setLoading(false);
        window.hydrant = hydrantObj;
      } else {
        // Redirect to the indicated term, while storing the initially requested
        // term in the "ti" parameter (if necessary) so that the user can be
        // notified
        if (urlName === latestTerm.semester.urlName) {
          params.delete("t");
        } else {
          params.set("t", urlName);
        }
        if (shouldWarn) {
          params.set("ti", urlNameOrig);
        }
        window.location.search = params.toString();
      }
    };

    void fetchData();
  }, []);

  const { colorMode, setColorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    if (loading || !hydrant) return;
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
  }, [colorMode, hydrant, loading]);

  return { hydrant, state };
}
