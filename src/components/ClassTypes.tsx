import { Button, ButtonGroup, Center, Stack } from "@chakra-ui/react";
import { ActivityDescription } from "./ActivityDescription";
import { ClassTable } from "./ClassTable";
import { MatrixLink, PreregLink } from "./ButtonsLinks";
import { SelectedActivities } from "./SelectedActivities";
import { Tooltip } from "./ui/tooltip";
import { useContext, useState } from "react";
import { HydrantContext } from "~/lib/hydrant";
import { useICSExport } from "~/lib/gapi";
import { ClassType } from "~/lib/schema";
import {
  LuCalendarArrowDown,
  LuGraduationCap,
  LuVolleyball,
} from "react-icons/lu";
import type { IconType } from "react-icons/lib";

export const Academic = () => {
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
    <Stack gap={6}>
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
              <LuCalendarArrowDown />
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
    </Stack>
  );
};

export const PEandW = () => {
  return <></>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const CLASS_TYPE_COMPONENTS: Record<
  ClassType,
  [IconType, React.ComponentType]
> = {
  [ClassType.ACADEMIC]: [LuGraduationCap, Academic],
  [ClassType.PEW]: [LuVolleyball, PEandW],
};
