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
export function classTypeComponents(termKeys: string[]) {
  const obj = {} as Record<ClassType, [IconType, React.ComponentType]>;

  if (termKeys.includes("academic")) {
    obj[ClassType.ACADEMIC] = [LuGraduationCap, Academic];
  }

  if (termKeys.includes("pe")) {
    obj[ClassType.PEW] = [LuVolleyball, PEandW];
  }

  return obj;
}
