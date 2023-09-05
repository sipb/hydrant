import { Button, Flex, Image, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, useColorModeValue } from "@chakra-ui/react";

import { Term } from "../lib/dates";
import { State } from "../lib/state";
import { useState, useRef } from "react";
import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import { Preferences, DEFAULT_PREFERENCES } from "../lib/schema";

function PreferencesModal(props: {
  state: State;
  preferences: Preferences;
}) {
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

  return (
    <>
      <Button onClick={onOpen}>Preferences</Button>
      <Modal isOpen={visible} onClose={onCancel}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Preferences</ModalHeader>
          <ModalBody>
            <Flex gap={4}>
              Color scheme:
              <Select
                value={preferences.colorScheme.name}
                onChange={(e) => {
                  const colorScheme = COLOR_SCHEME_PRESETS.find(
                    ({ name }) => name === e.target.value
                  );
                  if (!colorScheme) return;
                  previewPreferences({ ...preferences, colorScheme });
                }}
              >
                {COLOR_SCHEME_PRESETS.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onCancel} mr={2}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/** Given a urlName like i22, return its corresponding URL. */
function toFullUrl(urlName: string, latestUrlName: string): string {
  const url = new URL(window.location.href);
  Array.from(url.searchParams.keys()).forEach((key) => {
    url.searchParams.delete(key);
  })
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
const EXCLUDED_URLS = ["i23"];

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
export function Header(props: { state: State, preferences: Preferences }) {
  const { state, preferences } = props;
  const logoSrc = useColorModeValue("img/logo.svg", "img/logo-dark.svg");
  const toUrl = (urlName: string) =>
    toFullUrl(urlName, state.latestTerm.urlName);
  const defaultValue = toUrl(state.term.urlName);

  return (
    <Flex align="end" gap={3}>
      <Image src={logoSrc} alt="Hydrant logo" h="40px" pos="relative" top={2} />
      <Select
        size="sm"
        w="fit-content"
        mr={3}
        defaultValue={defaultValue}
        onChange={(e) => {
          const elt = e.target;
          window.location.href = elt.options[elt.selectedIndex].value;
        }}
      >
        {getUrlNames(state.latestTerm.urlName).map((urlName) => {
          const { niceName } = new Term({ urlName });
          return (
            <option key={urlName} value={toUrl(urlName)}>
              {niceName}
            </option>
          );
        })}
      </Select>
      <PreferencesModal preferences={preferences} state={state} />
    </Flex>
  );
}
