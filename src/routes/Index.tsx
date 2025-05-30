import { useState, useContext } from "react";

import { Center, Flex, Group, Button, ButtonGroup } from "@chakra-ui/react";
import { Tooltip } from "../components/ui/tooltip";
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
import { LuCalendar } from "react-icons/lu";

import { State } from "../lib/state";
import { Term } from "../lib/dates";
import { useICSExport } from "../lib/gapi";
import type { SemesterData } from "../lib/hydrant";
import { useHydrant, HydrantContext, fetchNoCache } from "../lib/hydrant";
import { getClosestUrlName, type LatestTermInfo } from "../lib/dates";

import type { Route } from "./+types/Index";

// eslint-disable-next-line react-refresh/only-export-components
export async function clientLoader({ request }: Route.ClientActionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const urlNameOrig = searchParams.get("t");

  const latestTerm = await fetchNoCache<LatestTermInfo>("/latestTerm.json");
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

  const { classes, lastUpdated, termInfo } = await fetchNoCache<SemesterData>(
    `/${termToFetch}.json`,
  );
  const classesMap = new Map(Object.entries(classes));

  return {
    globalState: new State(
      classesMap,
      new Term(termInfo),
      lastUpdated,
      latestTerm.semester.urlName,
    ),
  };
}

/** The application entry. */
function HydrantApp() {
  const { state } = useContext(HydrantContext);

  const [isExporting, setIsExporting] = useState(false);
  // TODO: fix gcal export
  const onICSExport = useICSExport(
    state,
    () => {
      setIsExporting(false);
    },
    () => {
      setIsExporting(false);
    },
  );

  return (
    <>
      <FeedbackBanner />
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
              <Group gap={4}>
                <ScheduleSwitcher />
              </Group>
              <PreferencesDialog />
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
              <PreregLink />
              <MatrixLink />
            </ButtonGroup>
          </Center>
          <SelectedActivities />
          <ClassTable />
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
  const hydrantData = useHydrant({ globalState });

  return (
    <HydrantContext value={hydrantData}>
      <HydrantApp />
    </HydrantContext>
  );
}
