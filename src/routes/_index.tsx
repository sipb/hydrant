import { Center, Flex, Group, Tabs, ButtonGroup } from "@chakra-ui/react";
import { Calendar } from "../components/Calendar";
import { LeftFooter } from "../components/Footers";
import { Header, PreferencesDialog } from "../components/Header";
import { SelectedActivities } from "../components/SelectedActivities";
import { ScheduleOption } from "../components/ScheduleOption";
import { ScheduleSwitcher } from "../components/ScheduleSwitcher";
import { TermSwitcher } from "../components/TermSwitcher";
import { Banner } from "../components/Banner";
import {
  MatrixLink,
  PreregLink,
  ExportCalendar,
} from "../components/ButtonsLinks";
import { CLASS_TYPE_COMPONENTS } from "../components/ClassTypes";

import { State } from "../lib/state";
import { Term } from "../lib/dates";
import type { SemesterData } from "../lib/hydrant";
import { useHydrant, HydrantContext, fetchNoCache } from "../lib/hydrant";
import { getClosestUrlName, type LatestTermInfo } from "../lib/dates";

import type { Route } from "./+types/_index";
import { useContext } from "react";
import type { ClassType } from "~/lib/schema";
import { ActivityDescription } from "~/components/ActivityDescription";

// eslint-disable-next-line react-refresh/only-export-components
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
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
              <Group gap={4}>
                <ScheduleSwitcher />
              </Group>
              <PreferencesDialog />
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
          <Tabs.Root
            lazyMount
            fitted
            variant="enclosed"
            value={state.currentClassType}
            onValueChange={(e) => {
              state.currentClassType = e.value as ClassType;
            }}
          >
            <Tabs.List>
              {Object.entries(CLASS_TYPE_COMPONENTS).map(([key, [Icon]]) => (
                <Tabs.Trigger value={key as ClassType} key={key}>
                  <Icon />
                  {key}
                </Tabs.Trigger>
              ))}
              <Tabs.Indicator />
            </Tabs.List>
            {Object.entries(CLASS_TYPE_COMPONENTS).map(
              ([key, [_, Component]]) => (
                <Tabs.Content
                  value={key as ClassType}
                  key={key}
                  _open={{
                    animationName: "fade-in, scale-in",
                    animationDuration: "300ms",
                  }}
                  _closed={{
                    animationName: "fade-out, scale-out",
                    animationDuration: "120ms",
                  }}
                >
                  <Component />
                </Tabs.Content>
              ),
            )}
          </Tabs.Root>
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
