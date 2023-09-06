import { Button, Tooltip } from "@chakra-ui/react";
import { Activity } from "../lib/activity";
import { Class } from "../lib/class";
import { ChatIcon, ExternalLinkIcon } from "@chakra-ui/icons";

/** A link to SIPB Matrix's class group chat importer UI */
export function MatrixLink(props: { selectedActivities: Array<Activity> }) {
  const { selectedActivities } = props;

  // reference: https://github.com/gabrc52/class_group_chats/tree/main/src/routes/import
  const matrixLink = `https://matrix.mit.edu/classes/import?via=Hydrant${(selectedActivities
    .filter((activity) => activity instanceof Class) as Class[])
    .map((cls) => `&class=${cls.number}`)
    .join('')
  }`;

  return (
    <>
      <a href={matrixLink} target="_blank" rel="noreferrer">
        <Tooltip
          label="You will be able to choose which chats to join, if any.">
          <Button
            colorScheme="teal"
            leftIcon={<ChatIcon />}
            rightIcon={<ExternalLinkIcon />}
            size="sm">Join group chats on Matrix</Button>
        </Tooltip>
      </a>
    </>
  );
}