import { useContext, useMemo } from "react";

import { Center, Flex, Group, ButtonGroup } from "@chakra-ui/react";
import { ActivityDescription } from "../components/ActivityDescription";
import { Calendar } from "../components/Calendar";
import { LeftFooter } from "../components/Footers";
import { Header, PreferencesDialog } from "../components/Header";
import { SelectedActivities } from "../components/SelectedActivities";
import { ScheduleOption } from "../components/ScheduleOption";
import { ScheduleSwitcher } from "../components/ScheduleSwitcher";
import { TermSwitcher } from "../components/TermSwitcher";
import { Banner } from "../components/Banner";
import { AuthButton } from "../components/Auth";
import {
  MatrixLink,
  PreregLink,
  ExportCalendar,
} from "../components/ButtonsLinks";
import { ClassTypesSwitcher } from "../components/ClassTypes";

import { State } from "../lib/state";
import { Term } from "../lib/dates";
import { type SemesterData, getStateMaps } from "../lib/hydrant";
import { useHydrant, HydrantContext, fetchNoCache } from "../lib/hydrant";
import { getClosestUrlName, type LatestTermInfo } from "../lib/dates";
import { SessionContext } from "../lib/auth";

import type { Route } from "./+types/_index";

// eslint-disable-next-line react-refresh/only-export-components
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
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

clientLoader.hydrate = true as const;

/** The application entry. */
function HydrantApp() {
  return (
    <>
      <Banner />
      <Flex w="100%" direction={{ base: "column", lg: "row" }} p={4} gap={8}>
        <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
          <Header />
          <ScheduleOption />
          <Calendar />
          <LeftFooter />
        </Flex>
        <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
          <Center>
            <Group wrap="wrap" justifyContent="center" gap={4}>
              <TermSwitcher />
              <Group>
                <ScheduleSwitcher />
              </Group>
              <Group>
                <PreferencesDialog />
                <AuthButton />
              </Group>
            </Group>
          </Center>
          <Center>
            <ButtonGroup wrap="wrap" justifyContent="center" gap={2}>
              <ExportCalendar />
              <PreregLink />
              <MatrixLink />
            </ButtonGroup>
          </Center>
          <SelectedActivities />
          <ClassTypesSwitcher />
          <ActivityDescription />
        </Flex>
      </Flex>
    </>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
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

  useMemo(() => {
    hydrantData.state.loadAccessToken(session?.get("access_token"));
  }, [session, hydrantData.state]);

  return (
    <HydrantContext value={hydrantData}>
      <HydrantApp />
    </HydrantContext>
  );
}
