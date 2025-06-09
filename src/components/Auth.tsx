import { IconButton } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import { LuLogIn, LuLogOut } from "react-icons/lu";
import { Link } from "react-router";
import { useContext, useMemo } from "react";
import { SessionContext } from "../lib/auth";

export function AuthButton() {
  const session = useContext(SessionContext);
  const username = useMemo(() => session?.get("academic_id"), [session]);

  return username ? (
    // LOGGED IN
    <Tooltip
      content={`Welcome ${username.split("@")[0]}! Click here to log out.`}
    >
      <IconButton aria-label="Logout" size="sm" variant="outline" asChild>
        <Link to="/auth/logout">
          <LuLogOut />
        </Link>
      </IconButton>
    </Tooltip>
  ) : (
    // LOGGED OUT
    <Tooltip content="Click to log in!">
      <IconButton aria-label="Login" size="sm" variant="outline" asChild>
        <Link to="/auth/login">
          <LuLogIn />
        </Link>
      </IconButton>
    </Tooltip>
  );
}
