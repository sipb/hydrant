import { Card, IconButton, Flex, Image, Text, Button } from "@chakra-ui/react";
import { LuSettings, LuX } from "react-icons/lu";

import {
  DialogRoot,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogActionTrigger,
} from "./ui/dialog";
import { useColorModeValue } from "./ui/color-mode";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./ui/select";

import { createListCollection } from "@chakra-ui/react";

import type { State } from "../lib/state";
import { useState, useRef } from "react";
import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import type { Preferences} from "../lib/schema";
import { DEFAULT_PREFERENCES } from "../lib/schema";

import logo from "../assets/logo.svg";
import logoDark from "../assets/logo-dark.svg";
import hydraAnt from "../assets/hydraAnt.png";
import { SIPBLogo } from "./SIPBLogo";

export function PreferencesDialog(props: {
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
      <DialogRoot
        open={visible}
        onOpenChange={(e) => {
          if (e.open) {
            onOpen();
          } else {
            onCancel();
          }
        }}
      >
        <DialogTrigger asChild>
          <IconButton size="sm" aria-label="Change theme" variant="outline">
            <LuSettings />
          </IconButton>
        </DialogTrigger>
        <DialogContent>
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
                <SelectContent portalled={false}>
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
            <DialogActionTrigger asChild>
              <Button>Cancel</Button>
            </DialogActionTrigger>
            <Button onClick={onConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

/** Header above the left column, with logo and semester selection. */
export function Header(props: { state: State }) {
  const { state } = props;
  const logoSrc = useColorModeValue(logo, logoDark);

  const params = new URLSearchParams(document.location.search);
  const urlNameOrig = params.get("ti");
  const urlName = params.get("t") ?? state.latestUrlName;

  const [show, setShow] = useState(urlNameOrig !== null);

  const onClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("ti");
    window.history.pushState({}, "", url);
    setShow(false);
  };

  return (
    <Flex align="center" gap={3} wrap="wrap">
      <Image
        src={hydraAnt}
        alt="Hydrant ant logo"
        h="90px"
        pos="relative"
        top={-0.6}
        right={-1}
      />
      <Flex direction="column" gap={2}>
        <Image
          src={logoSrc}
          alt="Hydrant logo"
          h="40px"
          pos="relative"
          top={2}
        />
        <Flex justify="flex-start">
          <SIPBLogo />
        </Flex>
      </Flex>
      {show && (
        <Card.Root size="sm" variant="subtle">
          <Card.Body px={3} py={1}>
            <Flex align="center" gap={1.5}>
              <Text fontSize="sm">
                Term {urlNameOrig} not found; loaded term {urlName} instead.
              </Text>
              <IconButton
                variant="subtle"
                size="xs"
                aria-label="Close"
                onClick={onClose}
              >
                <LuX />
              </IconButton>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </Flex>
  );
}
