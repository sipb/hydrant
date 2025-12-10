import { IconButton } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import { LuLogIn, LuLogOut } from "react-icons/lu";
import { Link, useLocation } from "react-router";
import { useContext, useMemo } from "react";
import { SessionContext } from "../lib/auth";

export function AuthButton() {
  const session = useContext(SessionContext);
  const location = useLocation();

  const [tooltipContent, label, pathname, UserIcon, color] = useMemo(() => {
    const username = session?.get("academic_id");

    if (username) {
      return [
        `Welcome ${username.split("@")[0]}! Click here to log out.`,
        "Logout",
        "/auth/logout",
        LuLogOut,
        "red",
      ];
    } else {
      return ["Click to log in!", "Login", "/auth/login", LuLogIn, "blue"];
    }
  }, [session]);

  return (
    <Tooltip content={tooltipContent}>
      <IconButton
        aria-label={label}
        size="sm"
        variant="outline"
        colorPalette={color}
        asChild
      >
        <Link
          to={{
            pathname,
            search:
              location.pathname != "/"
                ? `?next=${location.pathname}`
                : undefined,
          }}
        >
          <UserIcon />
        </Link>
      </IconButton>
    </Tooltip>
  );
}
