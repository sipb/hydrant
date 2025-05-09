import { useState, useContext } from "react";
import {
  Center,
  Flex,
  Group,
  Spinner,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";

import { useHydrant, HydrantContext } from "../lib/hydrant";

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
import { useICSExport } from "../lib/gapi";
import { LuCalendar } from "react-icons/lu";

import type { Route } from "./+types/Index";

/** The application entry. */
function HydrantApp() {
  const { hydrant, state } = useContext(HydrantContext);

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
  const hydrantData = useHydrant();

  return (
    <HydrantContext value={hydrantData}>
      <HydrantApp />
    </HydrantContext>
  );
}
