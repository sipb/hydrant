import { AddIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { Button, Flex, Text } from "@chakra-ui/react";
import { ComponentProps } from "react";

import { Activity } from "../lib/activity";
import { textColor } from "../lib/colors";
import { Class } from "../lib/class";
import { State } from "../lib/state";

export function ColorButton(
  props: ComponentProps<"button"> & { color: string }
) {
  const { children, color, style, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      style={{
        ...style,
        backgroundColor: color,
        borderColor: color,
        color: textColor(color),
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
      onClick={() => state.setViewedActivity(activity)}
      onDoubleClick={() => state.removeActivity(activity)}
    >
      {activity.buttonName}
    </ColorButton>
  );
}

/** List of selected activities; one button for each activity. */
export function SelectedActivities(props: {
  selectedActivities: Array<Activity>;
  units: number;
  hours: number;
  warnings: Array<string>;
  state: State;
}) {
  const { selectedActivities, units, hours, warnings, state } = props;

  return (
    <Flex direction="column" gap={2}>
      <Flex gap={8} justify="center">
        <Text>{units} units</Text>
        <Text>{hours.toFixed(1)} hours</Text>
      </Flex>
      <Flex align="center" wrap="wrap">
        {selectedActivities.map((activity) => (
          <ActivityButton
            key={activity instanceof Class ? activity.number : activity.id}
            activity={activity}
            state={state}
          />
        ))}
        <Button
          leftIcon={<AddIcon />}
          onClick={() => state.addActivity()}
          size="sm"
        >
          Activity
        </Button>
        <Button 
          leftIcon={<ExternalLinkIcon />}
          onClick={
            () => {
              var classNumbers : string[] = []
              for(var i = 0; i < selectedActivities.length; i++){
                var activity : Activity = selectedActivities[i]
                if(activity instanceof Class){
                  classNumbers.push(activity.number)
                }
              }
              console.log(classNumbers)
              window.open("https://www.google.com") //replace with actual call using classNumbers
            }
          }
          size="sm"
        >Join Your Classes</Button>
      </Flex>
      {warnings.map((warning) => (
        <Flex key={warning} justify="center">
          <Text fontSize="sm">{warning}</Text>
        </Flex>
      ))}
    </Flex>
  );
}
