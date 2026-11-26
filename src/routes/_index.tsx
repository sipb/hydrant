import { useContext, useEffect } from "react";

import {
  Box,
  Flex,
  Grid,
  Group,
  SkipNavContent,
  SkipNavLink,
  type GridProps,
} from "@chakra-ui/react";

import { ActivityDescription } from "../components/ActivityDescription";
import { Banner } from "../components/Banner";
import { ScheduleActions } from "../components/ButtonsLinks";
import { CalendarPanel } from "../components/Calendar";
import { ClassTypesSwitcher } from "../components/ClassTypes";
import { Footer } from "../components/Footers";
import { Header, PreferencesDialog } from "../components/Header";
import { SelectedActivities } from "../components/SelectedActivities";
import { ScheduleSwitcher } from "../components/ScheduleSwitcher";
import { TermSwitcher } from "../components/TermSwitcher";
import {
  AuthButton,
  SyncConflictDialog,
  UntaggedSchedulesDialog,
} from "../components/Auth";

import { State } from "../lib/state";
import { Term, getClosestUrlName, type LatestTermInfo } from "../lib/dates";
import {
  useHydrant,
  HydrantContext,
  fetchNoCache,
  getStateMaps,
  type SemesterData,
} from "../lib/hydrant";
import { SessionContext } from "../lib/auth";

import type { Route } from "./+types/_index";

export async function clientLoader({ url }: Route.ClientLoaderArgs) {
  const searchParams = url.searchParams;
  const urlNameOrig = searchParams.get("t");

  const latestTerm = await fetchNoCache<LatestTermInfo>(
    import.meta.env.BASE_URL + "latestTerm.json",
  );
  const { urlName, shouldWarn } = getClosestUrlName(
    urlNameOrig,
    latestTerm.semester.urlName,
  );

  let termToFetch: string;
  if (urlName === urlNameOrig || urlNameOrig === null) {
    termToFetch = urlName === latestTerm.semester.urlName ? "latest" : urlName;
  } else {
    if (urlName === latestTerm.semester.urlName) {
      searchParams.delete("t");
      termToFetch = "latest";
    } else {
      searchParams.set("t", urlName);
      termToFetch = urlName;
    }
    if (shouldWarn) {
      searchParams.set("ti", urlNameOrig);
    }
    window.location.search = searchParams.toString();
  }

  const { classes, lastUpdated, termInfo, pe, locations } =
    await fetchNoCache<SemesterData>(
      `${import.meta.env.BASE_URL}${termToFetch}.json`,
    );
  const { classesMap, peClassesMap, locationsMap } = getStateMaps(
    classes,
    pe,
    locations,
  );

  return {
    globalState: new State(
      classesMap,
      peClassesMap,
      locationsMap,
      new Term(termInfo),
      lastUpdated,
      latestTerm.semester.urlName,
    ),
  };
}

/** two col on desktop, one on mobile */
const pageLayout: GridProps = {
  w: "100%",
  p: 4,
  columnGap: 8,
  rowGap: 6,
  templateColumns: { base: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" },
  templateAreas: {
    base: `"header" "main" "calendar" "footer"`,
    lg: `"header main" "calendar main" "footer main"`,
  },
  templateRows: { lg: "auto 1fr auto" },
};

function ScheduleToolbar() {
  return (
    <Group wrap="wrap" justifyContent="center" alignSelf="center" gap={4}>
      <TermSwitcher />
      <Group>
        <ScheduleSwitcher />
      </Group>
      <Group>
        <PreferencesDialog />
        <AuthButton />
      </Group>
    </Group>
  );
}

clientLoader.hydrate = true as const;

/** The application entry. */
function HydrantApp() {
  return (
    <>
      <SkipNavLink>Skip to content</SkipNavLink>
      <Banner />
      <Grid {...pageLayout}>
        <Box as="header" gridArea="header">
          <Header />
        </Box>
        <SkipNavContent asChild>
          <Flex as="main" gridArea="main" direction="column" gap={6}>
            <ScheduleToolbar />
            <ScheduleActions />
            <SelectedActivities />
            <ClassTypesSwitcher />
            <ActivityDescription />
          </Flex>
        </SkipNavContent>
        <CalendarPanel />
        <Box as="footer" gridArea="footer">
          <Footer />
        </Box>
      </Grid>
      <SyncConflictDialog />
      <UntaggedSchedulesDialog />
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
export default function App({ loaderData }: Route.ComponentProps) {
  const { globalState } = loaderData;
  const session = useContext(SessionContext);
  const hydrantData = useHydrant({ globalState });

  useEffect(() => {
    hydrantData.state.loadAccessToken(
      session?.get("access_token"),
      session?.get("username"),
    );
  }, [session, hydrantData.state]);

  return (
    <HydrantContext value={hydrantData}>
      <HydrantApp />
    </HydrantContext>
  );
}
