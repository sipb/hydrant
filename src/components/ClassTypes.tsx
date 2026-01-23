import { ClassTable } from "./ClassTable";
import { PEClassTable } from "./PEClassTable";
import { ClassType } from "~/lib/schema";
import { LuGraduationCap, LuVolleyball } from "react-icons/lu";
import type { IconType } from "react-icons/lib";

export const Academic = () => {
  return <ClassTable />;
};

export const PEandW = () => {
  return <PEClassTable />;
};

// eslint-disable-next-line react-refresh/only-export-components
export const CLASS_TYPE_COMPONENTS: Record<
  ClassType,
  [IconType, React.ComponentType]
> = {
  [ClassType.ACADEMIC]: [LuGraduationCap, Academic],
  [ClassType.PEW]: [LuVolleyball, PEandW],
};
