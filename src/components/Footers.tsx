import {
  Button,
  Flex,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useRef, useState } from "react";

import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import { State } from "../lib/state";
import { useCalendarExport } from "../lib/gapi";
import { DEFAULT_PREFERENCES, Preferences } from "../lib/schema";

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

function AboutModal() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Link onClick={() => setVisible(true)}>About</Link>
      <Modal isOpen={visible} onClose={() => setVisible(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Hydrant</ModalHeader>
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Text>
                Hydrant is a student-run class planner for MIT students,
                maintained by SIPB, the{" "}
                <Link href="https://sipb.mit.edu/">
                  Student Information Processing Board
                </Link>
                .
              </Text>
              <Text>
                We welcome contributions! View the source code or file issues on{" "}
                <Link href="https://github.com/sipb/hydrant">Github</Link>,
                or come to a SIPB meeting and ask how to help.
              </Text>
              <Text>
                We'd like to thank Edward Fan for creating{" "}
                <Link href="https://firehose.guide/">Firehose</Link>, the basis
                for Hydrant, and the{" "}
                <Link href="https://fireroad.mit.edu/">FireRoad</Link> team for
                collaborating with us.
              </Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setVisible(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/** The footer on the bottom of the calendar. */
export function LeftFooter(props: {
  preferences: Preferences;
  state: State;
}) {
  const { preferences, state } = props;

  const [isExporting, setIsExporting] = useState(false);
  // TODO: fix gcal export
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onCalendarExport = useCalendarExport(
    state,
    () => setIsExporting(false),
    () => setIsExporting(false)
  );

  return (
    <Flex
      direction="column"
      align="center"
      gap={2}
      opacity={0.3}
      _hover={{ opacity: 1 }}
      transition="0.5s opacity"
    >
      <Flex gap={4} align="center">
        <PreferencesModal preferences={preferences} state={state} />
        <Tooltip
          label={
            isExporting
              ? "Loading..."
              : "Google Calendar export is currently broken, we're fixing it!"
          }
        >
          {isExporting ? (
            <Spinner m={3} />
          ) : (
            <Image src="img/calendar-button.png" alt="Sign in with Google" />
          )}
        </Tooltip>
        <Button onClick={onCalendarExport}>
          {isExporting ? <Spinner m={3} /> : "Generate .ics file"}
        </Button>
      </Flex>
      <Text>Last updated: {state.lastUpdated}.</Text>
      <Flex gap={4}>
        <AboutModal />
        <Link href="mailto:sipb-hydrant@mit.edu">Contact</Link>
        <Link href="privacy.html">Privacy Policy</Link>
      </Flex>
    </Flex>
  );
}
