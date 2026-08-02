import { Flex, Text, Button, ButtonGroup } from "@chakra-ui/react";
import { useContext, type ComponentPropsWithoutRef } from "react";

import type { Activity } from "../lib/activity";
import { textColor } from "../lib/colors";
import { Class } from "../lib/class";
import { HydrantContext } from "../lib/hydrant";

import { LuPlus } from "react-icons/lu";

export function ColorButton(
  props: ComponentPropsWithoutRef<"button"> & { color: string },
) {
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

/** big value and smaller label. */
function ScheduleStat(props: { value: string; label: string }) {
  const { value, label } = props;
  return (
    <Flex align="baseline" gap={1.5}>
      <Text textStyle="data" fontSize="lg" fontWeight="semibold">
        {value}
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
    </Flex>
  );
}

/** A button representing a single, selected activity. */
function ActivityButton(props: { activity: Activity }) {
  const { activity } = props;
  const { state } = useContext(HydrantContext);
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
  const { state, hydrantState } = useContext(HydrantContext);
  const { selectedActivities, units, hours, warnings } = hydrantState;

  return (
    <Flex direction="column" gap={2}>
      <Flex gap={8} justify="center">
        <ScheduleStat value={units.toString()} label="units" />
        <ScheduleStat value={hours.toFixed(1)} label="hours" />
        <ScheduleStat
          value={state.finalsCount.toString()}
          label={`final${state.finalsCount == 1 ? "" : "s"}`}
        />
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
          <Text fontSize="sm" color="fg.warning" textAlign="center">
            {warning}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
