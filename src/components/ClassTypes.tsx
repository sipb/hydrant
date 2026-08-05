import { useState } from "react";

import { Tabs } from "@chakra-ui/react";
import { LuGraduationCap, LuDumbbell } from "react-icons/lu";

import { useHydrantContext } from "../lib/hydrant";
import { ClassType } from "../lib/schema";
import { ClassTable } from "./ClassTable";
import { PEClassTable } from "./PEClassTable";

import type { IconType } from "react-icons/lib";

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
          {Object.entries(tabs).map(([key, [Icon, _]]) => (
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

  return Object.entries(tabs).map(([key, [_i, Component]]) => (
    <Component key={key} />
  ));
};
