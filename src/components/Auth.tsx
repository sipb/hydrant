import { IconButton } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import { LuUser } from "react-icons/lu";
import { Link } from "react-router";

export function AuthButton({ username }: { username: string | null }) {
  return (
    <Tooltip
      content={
        username
          ? `Welcome ${username.split("@")[0]}! Click here to log out.`
          : "Click to log in!"
      }
    >
      <IconButton
        aria-label="Login"
        size="sm"
        variant="outline"
        as={(props) => <Link to={username ? "/logout" : "/login"} {...props} />}
      >
        <LuUser />
      </IconButton>
    </Tooltip>
  );
}
