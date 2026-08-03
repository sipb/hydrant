import {
  Flex,
  Text,
  Button,
  ButtonGroup,
  type ButtonProps,
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";

import type { Activity } from "../lib/activity";
import { textColor } from "../lib/colors";
import { Class } from "../lib/class";
import { useHydrantContext } from "../lib/hydrant";

export function ColorButton(props: ButtonProps & { color: string }) {
  const { children, color, style, ...otherProps } = props;
  const contractColor = textColor(color);
  return (
    <Button
      {...otherProps}
      backgroundColor={color}
      _hover={{
        backgroundColor: `color-mix(in oklab, ${color} 92%, ${contractColor})`,
      }}
      _active={{
        backgroundColor: `color-mix(in oklab, ${color} 85%, ${contractColor}) !important`,
      }}
      borderColor={color}
      color={contractColor}
      style={{
        ...style,
      }}
    >
      {children}
    </Button>
  );
}

/** A button representing a single, selected activity. */
function ActivityButton(props: { activity: Activity }) {
  const { activity } = props;
  const { state } = useHydrantContext();
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
export function SelectedActivities() {
  const { state, hydrantState } = useHydrantContext();
  const { selectedActivities, units, hours, warnings } = hydrantState;

  return (
    <Flex direction="column" gap={2}>
      <Flex gap={8} justify="center">
        <Text>{units} units</Text>
        <Text>{hours.toFixed(1)} hours</Text>
        <Text>
          {state.finalsCount} final{state.finalsCount == 1 ? "" : "s"}
        </Text>
      </Flex>
      <ButtonGroup gap={0} wrap="wrap">
        {selectedActivities.map((activity) => (
          <ActivityButton
            key={activity instanceof Class ? activity.number : activity.id}
            activity={activity}
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
