import { useEffect, useRef, useState } from "react";
import {
  Center,
  Flex,
  Group,
  Spinner,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";

import { Tooltip } from "../components/ui/tooltip";
import { useColorMode } from "../components/ui/color-mode";

import type { LatestTermInfo, TermInfo } from "../lib/dates";
import { Term, getClosestUrlName } from "../lib/dates";
import { State } from "../lib/state";
import type { RawClass } from "../lib/rawClass";
import { Class } from "../lib/class";
import type { HydrantState } from "../lib/schema";
import { DEFAULT_STATE } from "../lib/schema";

import { ActivityDescription } from "../components/ActivityDescription";
import { Calendar } from "../components/Calendar";
import { ClassTable } from "../components/ClassTable";
import { LeftFooter } from "../components/Footers";
import { Header, PreferencesDialog } from "../components/Header";
import { ScheduleOption } from "../components/ScheduleOption";
import { ScheduleSwitcher } from "../components/ScheduleSwitcher";
import { SelectedActivities } from "../components/SelectedActivities";
import { TermSwitcher } from "../components/TermSwitcher";
import { FeedbackBanner } from "../components/FeedbackBanner";

import { MatrixLink } from "../components/MatrixLink";
import { PreregLink } from "../components/PreregLink";
import { useICSExport } from "../lib/gapi";
import { LuCalendar } from "react-icons/lu";

import type { Route } from "./+types/Index";

interface SemesterData {
  classes: Record<string, RawClass>;
  lastUpdated: string;
  termInfo: TermInfo;
}

/** Hook to fetch data and initialize State object. */
function useHydrant(): {
  hydrant?: State;
  state: HydrantState;
} {
  const [loading, setLoading] = useState(true);
  const hydrantRef = useRef<State>(undefined);
  const hydrant = hydrantRef.current;

  const [state, setState] = useState<HydrantState>(DEFAULT_STATE);

  /** Fetch from the url, which is JSON of type T. */
  const fetchNoCache = async <T,>(url: string): Promise<T> => {
    const res = await fetch(url, { cache: "no-cache" });
    return (await res.json()) as T;
  };

  useEffect(() => {
    const fetchData = async () => {
      const latestTerm = await fetchNoCache<LatestTermInfo>("latestTerm.json");
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
          await fetchNoCache<SemesterData>(`${term}.json`);
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

/**
 * "Integration callbacks" allow other SIPB projects to integrate with Hydrant by redirecting to
 * https://hydrant.mit.edu/#/export with a `callback` as a query parameter.
 *
 * Currently, the only application that uses this is the Matrix class group chat picker,
 * but in the future, a prompt "[Application name] would like to access your Hydrant class list"
 * could be implemented.
 */
const ALLOWED_INTEGRATION_CALLBACKS = [
  "https://matrix.mit.edu/classes/hydrantCallback",
  "https://uplink.mit.edu/classes/hydrantCallback",
];

/** The application entry. */
function HydrantApp() {
  const { hydrant, state } = useHydrant();

  // Integration callback URL
  const EXPORT_URL_HASH = "#/export";
  const hash = window.location.hash;
  // Detect whether to load the Hydrant app or an integration callback instead
  const hasIntegrationCallback = hash.startsWith(EXPORT_URL_HASH);

  // Integration callback hook
  useEffect(() => {
    // only trigger this code if the URL asked for it
    if (!hasIntegrationCallback) return;

    // wait until Hydrant loads
    if (!hydrant) return;

    const params = new URLSearchParams(hash.substring(EXPORT_URL_HASH.length));
    const callback = params.get("callback");
    if (!callback || !ALLOWED_INTEGRATION_CALLBACKS.includes(callback)) {
      console.warn("callback", callback, "not in allowed callbacks list!");
      window.alert(`${callback ?? ""} is not allowed to read your class list!`);
      return;
    }
    const encodedClasses = hydrant.selectedActivities
      .filter((activity) => activity instanceof Class)
      .map((cls) => `&class=${cls.number}`)
      .join("");
    const filledCallback = `${callback}?hydrant=true${encodedClasses}`;
    window.location.replace(filledCallback);
  }, [hydrant, hasIntegrationCallback, hash]);

  const [isExporting, setIsExporting] = useState(false);
  // TODO: fix gcal export
  const onICSExport = useICSExport(
    hydrant,
    () => {
      setIsExporting(false);
    },
    () => {
      setIsExporting(false);
    },
  );

  return (
    <>
      {!hydrant || hasIntegrationCallback ? (
        <Flex w="100%" h="100vh" align="center" justify="center">
          <Spinner />
        </Flex>
      ) : (
        <>
          <FeedbackBanner
            isOpen={hydrant.showFeedback}
            setOpen={(setBool: boolean) => {
              hydrant.showFeedback = setBool;
            }}
          />
          <Flex
            w="100%"
            direction={{ base: "column", lg: "row" }}
            p={4}
            gap={8}
          >
            <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
              <Header state={hydrant} />
              <ScheduleOption
                selectedOption={state.selectedOption}
                totalOptions={state.totalOptions}
                state={hydrant}
              />
              <Calendar
                selectedActivities={state.selectedActivities}
                viewedActivity={state.viewedActivity}
                state={hydrant}
              />
              <LeftFooter state={hydrant} />
            </Flex>
            <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
              <Center>
                <Group wrap="wrap" justifyContent="center" gap={4}>
                  <TermSwitcher state={hydrant} />
                  <Group gap={4}>
                    <ScheduleSwitcher
                      saveId={state.saveId}
                      saves={state.saves}
                      state={hydrant}
                    />
                  </Group>
                  <PreferencesDialog
                    state={hydrant}
                    preferences={state.preferences}
                  />
                </Group>
              </Center>
              <Center>
                <ButtonGroup wrap="wrap" justifyContent="center" gap={2}>
                  <Tooltip content="Currently, only manually exporting to an .ics file is supported.">
                    <Button
                      colorPalette="blue"
                      variant="solid"
                      size="sm"
                      loading={isExporting}
                      loadingText="Loading..."
                      onClick={() => {
                        setIsExporting(true);
                        onICSExport();
                      }}
                    >
                      <LuCalendar />
                      Export calendar
                    </Button>
                  </Tooltip>
                  <PreregLink selectedActivities={state.selectedActivities} />
                  <MatrixLink selectedActivities={state.selectedActivities} />
                </ButtonGroup>
              </Center>
              <SelectedActivities
                selectedActivities={state.selectedActivities}
                units={state.units}
                hours={state.hours}
                warnings={state.warnings}
                state={hydrant}
              />
              <ClassTable
                classes={hydrant.classes} // this is a constant; no need to add to state
                state={hydrant}
              />
              {state.viewedActivity ? (
                <ActivityDescription
                  activity={state.viewedActivity}
                  state={hydrant}
                />
              ) : null}
            </Flex>
          </Flex>
        </>
      )}
    </>
  );
}

export const meta: Route.MetaFunction = () => [
  { title: "Hydrant" },
  {
    name: "description",
    content: "Hydrant is a class planner for MIT students.",
  },
];

/** The main application. */
export default function App() {
  return <HydrantApp />;
}
