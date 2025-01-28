import { Activity } from "../lib/activity";
import { Class } from "../lib/class";
import { LuClipboardList } from "react-icons/lu";

import { LinkButton } from "./ui/link-button";
import { Tooltip } from "./ui/tooltip";

/** A link to SIPB Matrix's class group chat importer UI */
export function PreregLink(props: { selectedActivities: Array<Activity> }) {
  const { selectedActivities } = props;

  // reference: https://github.com/gabrc52/class_group_chats/tree/main/src/routes/import
  const preregLink = `https://student.mit.edu/cgi-bin/sfprwtrm.sh?${(
    selectedActivities.filter(
      (activity) => activity instanceof Class,
    ) as Class[]
  )
    .map((cls) => cls.number)
    .join(",")}`;

  return (
    <Tooltip content="This will import your current schedule into WebSIS.">
      <LinkButton
        colorPalette="cyan"
        size="sm"
        href={preregLink}
        variant="solid"
        target="_blank"
        rel="noreferrer"
        fontWeight={"semibold"}
      >
        <LuClipboardList />
        Pre-register classes
      </LinkButton>
    </Tooltip>
  );
}
