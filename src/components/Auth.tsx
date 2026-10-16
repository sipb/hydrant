import { useContext, useMemo } from "react";

import { IconButton } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import type { IconType } from "react-icons";
import { LuLogIn, LuLogOut } from "react-icons/lu";
import { Link, useLocation } from "react-router";
import { SessionContext } from "../lib/auth";

interface AuthConfig {
  tooltipContent: string;
  label: string;
  pathname: string;
  UserIcon: IconType;
  color?: string;
}

export function AuthButton() {
  const session = useContext(SessionContext);
  const location = useLocation();

  const { tooltipContent, label, pathname, UserIcon, color } =
    useMemo<AuthConfig>(() => {
      const username = session?.get("academic_id");

      if (username) {
        return {
          tooltipContent: `Welcome ${username.split("@")[0]}! Click here to log out.`,
          label: "Logout",
          pathname: "/auth/logout",
          UserIcon: LuLogOut,
          color: "red",
        };
      } else {
        return {
          tooltipContent: "Click to log in!",
          label: "Login",
          pathname: "/auth/login",
          UserIcon: LuLogIn,
        };
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
