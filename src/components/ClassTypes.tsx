import { Stack } from "@chakra-ui/react";
import { ClassTable } from "./ClassTable";
import { SelectedActivities } from "./SelectedActivities";
import { ClassType } from "~/lib/schema";
import { LuGraduationCap, LuVolleyball } from "react-icons/lu";
import type { IconType } from "react-icons/lib";

export const Academic = () => {
  return (
    <Stack gap={6}>
      <SelectedActivities />
      <ClassTable />
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
