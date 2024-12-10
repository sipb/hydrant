import { Flex, Image } from "@chakra-ui/react";

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

import { State } from "../lib/state";
import { useState, useRef } from "react";
import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import { Preferences, DEFAULT_PREFERENCES } from "../lib/schema";

import logo from "../assets/logo.svg";
import logoDark from "../assets/logo-dark.svg";
import { SIPBLogo } from "./SIPBLogo";

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
      <DialogRoot
        lazyMount
        open={visible}
        onOpenChange={(e) => (e.open ? onOpen() : onCancel())}
      >
        <DialogTrigger asChild>
          <Button size="sm">
            Change theme <ColorModeIcon />
          </Button>
        </DialogTrigger>
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
export function Header(props: { state: State; preferences: Preferences }) {
  const { state, preferences } = props;
  const logoSrc = useColorModeValue(logo, logoDark);

  return (
    <Flex align="center" gap={3} wrap="wrap">
      <Flex direction="column" gap={1}>
        <Image src={logoSrc} alt="Hydrant logo" h="40px" pos="relative" top={2} />
        <Flex justify="flex-end">
          <SIPBLogo />
        </Flex>
      </Flex>
      <PreferencesDialog preferences={preferences} state={state} />
    </Flex>
  );
}
