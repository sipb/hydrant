import { useState } from "react";

import { Tabs } from "@chakra-ui/react";
import { LuGraduationCap, LuDumbbell } from "react-icons/lu";

import { useHydrantContext } from "../lib/hydrant";
import { ClassType } from "../lib/schema";
import { ClassTable } from "./ClassTable";
import { PEClassTable } from "./PEClassTable";

import type { IconType } from "react-icons/lib";

const CLASS_TYPE_COMPONENTS: Record<
  ClassType,
  [IconType, React.ComponentType]
> = {
  [ClassType.ACADEMIC]: [LuGraduationCap, ClassTable],
  [ClassType.PEW]: [LuDumbbell, PEClassTable],
};

export const ClassTypesSwitcher = () => {
  const { state } = useHydrantContext();
  const [currentTab, setCurrentTab] = useState(ClassType.ACADEMIC);

  const tabs: Partial<Record<ClassType, [IconType, React.ComponentType]>> = {
    ...(state.classes.size > 0
      ? { [ClassType.ACADEMIC]: CLASS_TYPE_COMPONENTS[ClassType.ACADEMIC] }
      : {}),
    ...(state.peClasses.size > 0
      ? { [ClassType.PEW]: CLASS_TYPE_COMPONENTS[ClassType.PEW] }
      : {}),
  };

  if (Object.keys(tabs).length > 1)
    return (
      <Tabs.Root
        fitted
        size="sm"
        variant="line"
        value={currentTab}
        onValueChange={(e) => {
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          setCurrentTab(e.value as ClassType);
        }}
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
