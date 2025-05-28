import { Flex, Text, Button, ButtonGroup } from "@chakra-ui/react";
import type { ComponentPropsWithoutRef } from "react";

import type { Activity } from "../lib/activity";
import { multiplyColor, textColor } from "../lib/colors";
import { Class } from "../lib/class";
import type { State } from "../lib/state";

import { LuPlus } from "react-icons/lu";

export function ColorButton(
  props: ComponentPropsWithoutRef<"button"> & { color: string },
) {
  const { children, color, style, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      backgroundColor={color}
      borderColor={color}
      color={textColor(color)}
      _hover={{
        backgroundColor: multiplyColor(color, 1.1),
        color: textColor(multiplyColor(color, 1.1)),
      }}
      style={{
        ...style,
      }}
    >
      {children}
    </Button>
  );
}

/** A button representing a single, selected activity. */
function ActivityButton(props: { activity: Activity; state: State }) {
  const { activity, state } = props;
  const color = activity.backgroundColor;
  return (
    <ColorButton
      color={color}
      onClick={() => {
        state.setViewedActivity(activity);
      }}
      onDoubleClick={() => {
        state.removeActivity(activity);
      }}
    >
      <Text textStyle="md">{activity.buttonName}</Text>
    </ColorButton>
  );
}

/** List of selected activities; one button for each activity. */
export function SelectedActivities(props: {
  selectedActivities: Activity[];
  units: number;
  hours: number;
  warnings: string[];
  state: State;
}) {
  const { selectedActivities, units, hours, warnings, state } = props;

  return (
    <Flex direction="column" gap={2}>
      <Flex gap={8} justify="center">
        <Text>{units} units</Text>
        <Text>{hours.toFixed(1)} hours</Text>
      </Flex>
      <ButtonGroup gap={0} wrap="wrap">
        {selectedActivities.map((activity) => (
          <ActivityButton
            key={activity instanceof Class ? activity.number : activity.id}
            activity={activity}
            state={state}
          />
        ))}
        <Button
          onClick={() => {
            state.addActivity();
          }}
        >
          <LuPlus />
          Activity
        </Button>
      </ButtonGroup>
      {warnings.map((warning) => (
        <Flex key={warning} justify="center">
          <Text fontSize="sm">{warning}</Text>
        </Flex>
      ))}
    </Flex>
  );
}
