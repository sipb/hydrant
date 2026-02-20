import { Tabs } from "@chakra-ui/react";
import { useContext, useState } from "react";

import { ClassTable } from "./ClassTable";
import { PEClassTable } from "./PEClassTable";
import { ClassType } from "~/lib/schema";
import { LuGraduationCap, LuDumbbell } from "react-icons/lu";
import type { IconType } from "react-icons/lib";
import { HydrantContext } from "~/lib/hydrant";

function classTypeComponents(termKeys: ClassType[]) {
  const obj = {} as Record<ClassType, [IconType, React.ComponentType]>;

  if (termKeys.includes(ClassType.ACADEMIC)) {
    obj[ClassType.ACADEMIC] = [LuGraduationCap, ClassTable];
  }

  if (termKeys.includes(ClassType.PEW)) {
    obj[ClassType.PEW] = [LuDumbbell, PEClassTable];
  }

  return obj;
}

export const ClassTypesSwitcher = () => {
  const { state } = useContext(HydrantContext);
  const [currentTab, setCurrentTab] = useState(ClassType.ACADEMIC);

  const tabs = classTypeComponents([
    ...(state.classes.size > 0 ? [ClassType.ACADEMIC] : []),
    ...(state.peClasses.size > 0 ? [ClassType.PEW] : []),
  ]);

  if (Object.keys(tabs).length > 1)
    return (
      <Tabs.Root
        fitted
        size="sm"
        variant="line"
        value={currentTab}
        onValueChange={(e) => {
          setCurrentTab(e.value as ClassType);
        }}
      >
        <Tabs.List>
          {Object.entries(tabs).map(([key, [Icon]]) => (
            <Tabs.Trigger value={key as ClassType} key={key}>
              <Icon />
              {key}
            </Tabs.Trigger>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        {Object.entries(tabs).map(([key, [_, Component]]) => (
          <Tabs.Content value={key as ClassType} key={key}>
            <Component />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    );

  return Object.entries(tabs).map(([_k, [_i, Component]]) => <Component />);
};
