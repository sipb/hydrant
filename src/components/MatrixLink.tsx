import { useContext } from "react";

import { Class } from "../lib/class";
import { HydrantContext } from "../lib/hydrant";

import { LuMessagesSquare } from "react-icons/lu";
import { Tooltip } from "./ui/tooltip";
import { Link } from "react-router";
import { Button } from "@chakra-ui/react";

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
