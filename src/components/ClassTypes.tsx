import { useState } from "react";

import { Tabs, type TabsValueChangeDetails } from "@chakra-ui/react";
import { LuGraduationCap, LuDumbbell } from "react-icons/lu";
import type { IconType } from "react-icons/lib";

import { ClassTable } from "./ClassTable";
import { PEClassTable } from "./PEClassTable";

import { ClassType } from "../lib/schema";
import { useHydrantContext } from "../lib/hydrant";

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
  const { state } = useHydrantContext();
  const [currentTab, setCurrentTab] = useState(ClassType.ACADEMIC);

  const tabs = classTypeComponents([
    ...(state.classes.size > 0 ? [ClassType.ACADEMIC] : []),
    ...(state.peClasses.size > 0 ? [ClassType.PEW] : []),
  ]);

  const handleTabChange = (e: TabsValueChangeDetails) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
    setCurrentTab(e.value as ClassType);
  };

  if (Object.keys(tabs).length > 1)
    return (
      <Tabs.Root
        fitted
        size="sm"
        variant="line"
        value={currentTab}
        onValueChange={handleTabChange}
      >
        <Tabs.List>
          {Object.entries(tabs).map(([key, [Icon, _]]) => (
            <Tabs.Trigger value={key} key={key}>
              <Icon />
              {key}
            </Tabs.Trigger>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        {Object.entries(tabs).map(([key, [_, Component]]) => (
          <Tabs.Content value={key} key={key}>
            <Component />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    );

  return Object.entries(tabs).map(([key, [_i, Component]]) => (
    <Component key={key} />
  ));
};
