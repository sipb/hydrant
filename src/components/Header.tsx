import { Flex, Image } from "@chakra-ui/react";

import {
  DialogRoot,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useColorModeValue, ColorModeIcon } from "./ui/color-mode";
import { Button } from "./ui/button";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./ui/select";

import { createListCollection } from "@chakra-ui/react";

import { Term } from "../lib/dates";
import { State } from "../lib/state";
import { useState, useRef } from "react";
import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import { Preferences, DEFAULT_PREFERENCES } from "../lib/schema";

function PreferencesDialog(props: { state: State; preferences: Preferences }) {
  const { preferences: originalPreferences, state } = props;
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const initialPreferencesRef = useRef(DEFAULT_PREFERENCES);
  const initialPreferences = initialPreferencesRef.current;

  const onOpen = () => {
    initialPreferencesRef.current = originalPreferences;
    setPreferences(originalPreferences);
    setVisible(true);
  };

  const previewPreferences = (newPreferences: Preferences) => {
    setPreferences(newPreferences);
    state.setPreferences(newPreferences, false);
  };

  const onCancel = () => {
    setPreferences(initialPreferences);
    state.setPreferences(initialPreferences);
    setVisible(false);
  };

  const onConfirm = () => {
    state.setPreferences(preferences);
    setVisible(false);
  };

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Button onClick={onOpen} size="sm">
        Change theme <ColorModeIcon />
      </Button>
      <DialogRoot open={visible} onOpenChange={onCancel}>
        <DialogContent ref={contentRef}>
          <DialogHeader>
            <DialogTitle>Preferences</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Flex gap={4}>
              <SelectRoot
                collection={createListCollection({
                  items: COLOR_SCHEME_PRESETS.map(({ name }) => ({
                    label: name,
                    value: name,
                  })),
                })}
                value={[preferences.colorScheme.name]}
                onValueChange={(e) => {
                  const colorScheme = COLOR_SCHEME_PRESETS.find(
                    ({ name }) => name === e.value[0],
                  );
                  if (!colorScheme) return;
                  previewPreferences({ ...preferences, colorScheme });
                }}
              >
                <SelectLabel>Color scheme:</SelectLabel>
                <SelectTrigger>
                  <SelectValueText />
                </SelectTrigger>
                <SelectContent portalRef={contentRef}>
                  {COLOR_SCHEME_PRESETS.map(({ name }) => (
                    <SelectItem item={name} key={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button onClick={onCancel} mr={2}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

/** Given a urlName like i22, return its corresponding URL. */
function toFullUrl(urlName: string, latestUrlName: string): string {
  const url = new URL(window.location.href);
  Array.from(url.searchParams.keys()).forEach((key) => {
    url.searchParams.delete(key);
  });
  if (urlName !== latestUrlName) {
    url.searchParams.set("t", urlName);
  }
  return url.href;
}

/** Given a urlName like "i22", return the previous one, "f21". */
function getLastUrlName(urlName: string): string {
  const { semester, year } = new Term({ urlName });
  if (semester === "f") {
    return `s${year}`;
  } else if (semester === "s") {
    return `i${year}`;
  } else {
    return `f${parseInt(year, 10) - 1}`;
  }
}

/** urlNames that don't have a State */
const EXCLUDED_URLS = ["i23", "i24", "i25"];

/** Earliest urlName we have a State for. */
const EARLIEST_URL = "f22";

/** Return all urlNames before the given one. */
function getUrlNames(latestTerm: string): Array<string> {
  let urlName = latestTerm;
  const res = [];
  while (urlName !== EARLIEST_URL) {
    res.push(urlName);
    do {
      urlName = getLastUrlName(urlName);
    } while (EXCLUDED_URLS.includes(urlName));
  }
  res.push(EARLIEST_URL);
  return res;
}

/** Header above the left column, with logo and semester selection. */
export function Header(props: { state: State; preferences: Preferences }) {
  const { state, preferences } = props;
  const logoSrc = useColorModeValue("img/logo.svg", "img/logo-dark.svg");
  const toUrl = (urlName: string) =>
    toFullUrl(urlName, state.latestTerm.urlName);
  const defaultValue = toUrl(state.term.urlName);

  return (
    <Flex align="end" gap={3} wrap="wrap">
      <Image src={logoSrc} alt="Hydrant logo" h="40px" pos="relative" top={2} />
      <SelectRoot
        collection={createListCollection({
          items: getUrlNames(state.latestTerm.urlName).map((urlName) => {
            const { niceName } = new Term({ urlName });
            return {
              label: niceName,
              value: toUrl(urlName),
            };
          }),
        })}
        value={[defaultValue]}
        onValueChange={(e) => {
          window.location.href = e.value[0];
        }}
        size="sm"
        w="8rem"
        mr={3}
      >
        <SelectTrigger>
          <SelectValueText />
        </SelectTrigger>
        <SelectContent>
          {getUrlNames(state.latestTerm.urlName).map((urlName) => {
            const { niceName } = new Term({ urlName });
            return (
              <SelectItem item={toUrl(urlName)} key={toUrl(urlName)}>
                {niceName}
              </SelectItem>
            );
          })}
        </SelectContent>
      </SelectRoot>
      <PreferencesDialog preferences={preferences} state={state} />
    </Flex>
  );
}
