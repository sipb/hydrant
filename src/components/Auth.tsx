import { useContext, useMemo, useState } from "react";

import {
  Button,
  Dialog,
  Flex,
  IconButton,
  Portal,
  Select,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import type { IconType } from "react-icons";
import { LuLogIn, LuLogOut } from "react-icons/lu";
import { Link, useLocation } from "react-router";
import { SessionContext } from "../lib/auth";
import { useHydrantContext } from "../lib/hydrant";
import { displayAgent } from "../lib/sync";
import { getTerms } from "../lib/dates";

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
              location.pathname != "/" || location.search
                ? `?${new URLSearchParams({ next: location.pathname + location.search }).toString()}`
                : undefined,
          }}
        >
          <UserIcon />
        </Link>
      </IconButton>
    </Tooltip>
  );
}

/** ISO time as a local date, e.g. "Oct 21, 2026". */
const formatFireroadDate = (
  iso: string,
  options?: Intl.DateTimeFormatOptions,
) =>
  Temporal.Instant.from(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    ...options,
  });

/** asks which copy to keep when a schedule changed here and on Fireroad. */
export function SyncConflictDialog() {
  const { state, hydrantState } = useHydrantContext();
  const conflict = hydrantState.syncConflict;

  const otherDate = conflict?.otherDate
    ? formatFireroadDate(conflict.otherDate, { timeStyle: "short" })
    : "";
  const otherAgent =
    (conflict && displayAgent(conflict.otherAgent)) ?? "Another device";

  return (
    <Dialog.Root
      open={!!conflict}
      role="alertdialog"
      closeOnInteractOutside={false}
      closeOnEscape={false}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {conflict?.saveName} changed somewhere else
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {conflict?.deleted
                ? "This schedule was deleted from your Fireroad account, but it also has changes in this browser."
                : `${otherAgent} saved a different version on ${otherDate}. Which one do you want to keep? Keeping both saves the other version as a new schedule.`}
            </Dialog.Body>
            <Dialog.Footer flexWrap="wrap">
              <Button
                variant="outline"
                onClick={() => {
                  state.resolveSyncConflict("remote");
                }}
              >
                {conflict?.deleted ? "Delete it here too" : "Use other version"}
              </Button>
              {!conflict?.deleted && (
                <Button
                  variant="outline"
                  onClick={() => {
                    state.resolveSyncConflict("both");
                  }}
                >
                  Keep both
                </Button>
              )}
              <Button
                variant="solid"
                onClick={() => {
                  state.resolveSyncConflict("local");
                }}
              >
                Keep this version
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/** sentinel for not importing a schedule. */
const SKIP = "skip";

/** Asks which term each Fireroad schedule from another app belongs to. */
export function UntaggedSchedulesDialog() {
  const { state, hydrantState } = useHydrantContext();
  const { untaggedSchedules, syncConflict } = hydrantState;
  const [choices, setChoices] = useState<Record<number, string>>({});

  const options = createListCollection({
    items: [
      ...getTerms(state.latestUrlName).map((term) => ({
        label: term.niceName,
        value: term.urlName,
      })),
      { label: "Don't import", value: SKIP },
    ],
  });

  const hasChoice = untaggedSchedules.some((file) => file.remoteId in choices);

  return (
    <Dialog.Root
      open={untaggedSchedules.length > 0 && !syncConflict}
      onOpenChange={(e) => {
        if (!e.open) state.dismissUntaggedSchedules();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Which term are these schedules for?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Text>
                  These schedules in your Fireroad account were made in another
                  app, so they don't say which term they're for. Pick one and
                  they'll appear in Hydrant under that term.
                </Text>
                {untaggedSchedules.map((file) => (
                  <Flex
                    key={file.remoteId}
                    gap={3}
                    wrap="wrap"
                    align="center"
                    justify="space-between"
                  >
                    <Stack gap={0} minW={0} flex="1 1 12rem">
                      <Text fontWeight="semibold">{file.name}</Text>
                      <Text fontSize="sm" color="fg.muted">
                        {[
                          file.subjects.join(", ") || "No subjects",
                          `changed ${formatFireroadDate(file.changed)}`,
                        ].join(" · ")}
                      </Text>
                    </Stack>
                    <Select.Root
                      collection={options}
                      value={
                        file.remoteId in choices ? [choices[file.remoteId]] : []
                      }
                      onValueChange={(e) => {
                        setChoices({ ...choices, [file.remoteId]: e.value[0] });
                      }}
                      size="sm"
                      w="10rem"
                    >
                      <Select.HiddenSelect />
                      <Select.Label hidden>Term for {file.name}</Select.Label>
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Choose a term" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {options.items.map((option) => (
                            <Select.Item item={option} key={option.value}>
                              {option.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Flex>
                ))}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer flexWrap="wrap">
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Not now</Button>
              </Dialog.ActionTrigger>
              <Button
                variant="solid"
                disabled={!hasChoice}
                onClick={() => {
                  state.importUntaggedSchedules(
                    Object.fromEntries(
                      Object.entries(choices).map(([id, term]) => [
                        id,
                        term === SKIP ? null : term,
                      ]),
                    ),
                  );
                  setChoices({});
                }}
              >
                Save choices
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
