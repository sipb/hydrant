import { useState, useContext } from "react";

import {
  Center,
  Flex,
  Group,
  Spinner,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";
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

import { useICSExport } from "../lib/gapi";
import { useHydrant, HydrantContext } from "../lib/hydrant";

import type { Route } from "./+types/Index";

/** The application entry. */
function HydrantApp() {
  const { hydrant } = useContext(HydrantContext);

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
      {!hydrant ? (
        <Flex w="100%" h="100vh" align="center" justify="center">
          <Spinner />
        </Flex>
      ) : (
        <>
          <FeedbackBanner />
          <Flex
            w="100%"
            direction={{ base: "column", lg: "row" }}
            p={4}
            gap={8}
          >
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
  const hydrantData = useHydrant();

  return (
    <HydrantContext value={hydrantData}>
      <HydrantApp />
    </HydrantContext>
  );
}
