import { Activity } from "../lib/activity";
import { Class } from "../lib/class";
import { LuMessageSquare, LuExternalLink } from "react-icons/lu";

import { Tooltip } from "./ui/tooltip";
import { LinkButton } from "./ui/link-button";

/** A link to SIPB Matrix's class group chat importer UI */
export function MatrixLink(props: { selectedActivities: Array<Activity> }) {
  const { selectedActivities } = props;

  // reference: https://github.com/gabrc52/class_group_chats/tree/main/src/routes/import
  const matrixLink = `https://matrix.mit.edu/classes/import?via=Hydrant${(
    selectedActivities.filter(
      (activity) => activity instanceof Class,
    ) as Class[]
  )
    .map((cls) => `&class=${cls.number}`)
    .join("")}`;

  return (
    <Tooltip content="You will be able to choose which chats to join, if any.">
      <LinkButton
        colorPalette="teal"
        size="sm"
        href={matrixLink}
        target="_blank"
        rel="noreferrer"
        fontWeight={"bold"}
      >
        <LuMessageSquare />
        Join group chats on Matrix
        <LuExternalLink />
      </LinkButton>
    </Tooltip>
  );
}
