import { Class } from "../lib/class";
import { LuClipboardList } from "react-icons/lu";

import { LinkButton } from "./ui/link-button";
import { Tooltip } from "./ui/tooltip";
import { useContext } from "react";
import { HydrantContext } from "../lib/hydrant";

/** A link to SIPB Matrix's class group chat importer UI */
export function PreregLink() {
  const {
    state: { selectedActivities },
  } = useContext(HydrantContext);

  // reference: https://github.com/gabrc52/class_group_chats/tree/main/src/routes/import
  const preregLink = `https://student.mit.edu/cgi-bin/sfprwtrm.sh?${selectedActivities
    .filter((activity) => activity instanceof Class)
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
