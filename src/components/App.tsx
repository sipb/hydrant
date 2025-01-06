import { useEffect, useRef, useState } from "react";
// import { GoogleOAuthProvider } from "@react-oauth/google";
import { Center, Flex, Group, Spinner } from "@chakra-ui/react";

import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import { Provider } from "./ui/provider";
import { useColorMode } from "./ui/color-mode";

import { LatestTermInfo, Term, TermInfo } from "../lib/dates";
import { State } from "../lib/state";
import { RawClass } from "../lib/rawClass";
import { Class } from "../lib/class";
import { DEFAULT_STATE, HydrantState } from "../lib/schema";

import { ActivityDescription } from "./ActivityDescription";
import { Calendar } from "./Calendar";
import { ClassTable } from "./ClassTable";
import { LeftFooter } from "./Footers";
import { Header } from "./Header";
import { ScheduleOption } from "./ScheduleOption";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { SelectedActivities } from "./SelectedActivities";
import { TermSwitcher } from "./TermSwitcher";

import "@fontsource-variable/inter/index.css";
import { MatrixLink } from "./MatrixLink";
import { PreregLink } from "./PreregLink";
import { useICSExport } from "../lib/gapi";
import { LuCalendar } from "react-icons/lu";

// import calendarButtonImg from "../assets/calendar-button.svg";

type SemesterData = {
  classes: { [cls: string]: RawClass };
  lastUpdated: string;
  termInfo: TermInfo;
};

/** Hook to fetch data and initialize State object. */
function useHydrant(): {
  hydrant?: State;
  state: HydrantState;
} {
  const [loading, setLoading] = useState(true);
  const hydrantRef = useRef<State>();
  const hydrant = hydrantRef.current;

  const [state, setState] = useState<HydrantState>(DEFAULT_STATE);

  /** Fetch from the url, which is JSON of type T. */
  const fetchNoCache = async <T,>(url: string): Promise<T> => {
    const res = await fetch(url, { cache: "no-cache" });
    return res.json() as Promise<T>;
  };

  useEffect(() => {
    const fetchData = async () => {
      const latestTerm = await fetchNoCache<LatestTermInfo>("latestTerm.json");
      const params = new URLSearchParams(document.location.search);
      const term = params.get("t") ?? "latest";

      try {
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
      } catch (error) {
        // TODO: - make this nicer, without the try/catch
        //       - actually redirect to a valid URL
        //       - redirect 's'->latestSpring, 'f'->latestFall, etc.
        //       - have a visual cue if the term in the url is invalid
        if (error instanceof SyntaxError) {
          console.log(`Invalid term ${term}, showing latest term`);
          const { classes, lastUpdated, termInfo } =
            await fetchNoCache<SemesterData>("latest.json");
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
        }
      }
    };

    fetchData();
  }, []);

  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    if (loading || !hydrant) return;
    // if colorScheme changes, change colorMode to match
    hydrant.callback = (newState: HydrantState) => {
      setState(newState);
      if (colorMode !== newState.preferences.colorScheme.colorMode) {
        toggleColorMode?.();
      }
    };
    hydrant?.updateState();
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
      window.alert(`${callback} is not allowed to read your class list!`);
      return;
    }
    const encodedClasses = (
      hydrant.selectedActivities.filter(
        (activity) => activity instanceof Class,
      ) as Class[]
    )
      .map((cls) => `&class=${cls.number}`)
      .join("");
    const filledCallback = `${callback}?hydrant=true${encodedClasses}`;
    window.location.replace(filledCallback);
  }, [hydrant, hasIntegrationCallback, hash]);

  const [isExporting, setIsExporting] = useState(false);
  // TODO: fix gcal export
  const onICSExport = useICSExport(
    hydrant!,
    () => setIsExporting(false),
    () => setIsExporting(false),
  );

  return (
    <>
      {!hydrant || hasIntegrationCallback ? (
        <Flex w="100%" h="100vh" align="center" justify="center">
          <Spinner />
        </Flex>
      ) : (
        <Flex w="100%" direction={{ base: "column", lg: "row" }} p={4} gap={8}>
          <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
            <Header preferences={state.preferences} state={hydrant} />
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
              <Group wrap="wrap" justifyContent="center" gap={2}>
                <TermSwitcher state={hydrant} />
                <ScheduleSwitcher
                  saveId={state.saveId}
                  saves={state.saves}
                  state={hydrant}
                />
              </Group>
            </Center>
            <Center>
              <Group wrap="wrap" justifyContent="center" gap={2}>
                {/* <Tooltip
                  label={
                    isExporting
                      ? "Loading..."
                      : "Google Calendar export is currently broken, we're fixing it!"
                  }
                >
                  {isExporting ? (
                    <Spinner m={3} />
                  ) : (
                    <Image src={calendarButtonImg} alt="Sign in with Google" />
                  )}
                </Tooltip> */}
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
              </Group>
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
      )}
    </>
  );
}

/** The main application. */
export default function App() {
  return (
    <Provider>
      {/* <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}> */}
      <HydrantApp />
      {/* </GoogleOAuthProvider> */}
    </Provider>
  );
}
