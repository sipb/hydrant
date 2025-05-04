import type { Activity } from "../lib/activity";
import { Class } from "../lib/class";
import { LuMessageSquare } from "react-icons/lu";

import { Tooltip } from "./ui/tooltip";
import { LinkButton } from "./ui/link-button";

/** A link to SIPB Matrix's class group chat importer UI */
export function MatrixLink(props: { selectedActivities: Activity[] }) {
  const { selectedActivities } = props;

  // reference: https://github.com/gabrc52/class_group_chats/tree/main/src/routes/import
  const matrixLink = `https://matrix.mit.edu/classes/import?via=Hydrant${selectedActivities
    .filter((activity) => activity instanceof Class)
    .map((cls) => `&class=${cls.number}`)
    .join("")}`;

  return (
    <Tooltip content="You will be able to choose which chats to join, if any.">
      <LinkButton
        colorPalette="teal"
        size="sm"
        href={matrixLink}
        variant="solid"
        target="_blank"
        rel="noreferrer"
        fontWeight={"semibold"}
      >
        <LuMessageSquare />
        Join Matrix group chats
      </LinkButton>
    </Tooltip>
  );
}
