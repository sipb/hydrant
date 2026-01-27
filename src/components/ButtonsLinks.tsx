import { useContext, useState } from "react";

import { Class } from "../lib/class";
import { HydrantContext } from "../lib/hydrant";
import { useICSExport } from "../lib/gapi";

import {
  LuMessagesSquare,
  LuClipboardCopy,
  LuCalendarArrowDown,
} from "react-icons/lu";
import { Tooltip } from "./ui/tooltip";
import { Link } from "react-router";
import { Button, Image, Link as ChakraLink } from "@chakra-ui/react";

import sipbLogo from "../assets/simple-fuzzball.png";

export function ExportCalendar() {
  const { state } = useContext(HydrantContext);

  const [isExporting, setIsExporting] = useState(false);
  // TODO: fix gcal export
  const onICSExport = useICSExport(
    state,
    () => {
      setIsExporting(false);
    },
    () => {
      setIsExporting(false);
    },
  );

  return (
    <Tooltip content="Currently, only manually exporting to an .ics file is supported.">
      <Button
        colorPalette="blue"
        variant="solid"
        size="sm"
        loading={isExporting}
        loadingText="Loading..."
        onClick={() => {
          setIsExporting(true);
          onICSExport();
        }}
      >
        <LuCalendarArrowDown />
        Export calendar
      </Button>
    </Tooltip>
  );
}

/** A link to SIPB Matrix's class group chat importer UI */
export function MatrixLink() {
  const {
    state: { selectedActivities },
  } = useContext(HydrantContext);

  // reference: https://github.com/gabrc52/class_group_chats/tree/main/src/routes/import
  const matrixLink = `https://matrix.mit.edu/classes/import?via=Hydrant${selectedActivities
    .filter((activity) => activity instanceof Class)
    .map((cls) => `&class=${cls.number}`)
    .join("")}`;

  return (
    <Tooltip content="You will be able to choose which chats to join, if any.">
      <Button
        colorPalette="teal"
        size="sm"
        variant="solid"
        fontWeight={"semibold"}
        asChild
      >
        <Link to={matrixLink} target="_blank" rel="noreferrer">
          <LuMessagesSquare />
          Join Matrix group chats
        </Link>
      </Button>
    </Tooltip>
  );
}

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
      <Button
        colorPalette="cyan"
        size="sm"
        variant="solid"
        fontWeight={"semibold"}
        asChild
      >
        <Link to={preregLink} target="_blank" rel="noreferrer">
          <LuClipboardCopy />
          Pre-register classes
        </Link>
      </Button>
    </Tooltip>
  );
}

export function SIPBLogo() {
  return (
    <ChakraLink variant="plain" fontSize="sm" fontWeight="500" asChild>
      <Link to="https://sipb.mit.edu/" target="_blank" rel="noreferrer">
        by SIPB
        <Image src={sipbLogo} alt="SIPB Logo" height="1lh" />
      </Link>
    </ChakraLink>
  );
}
