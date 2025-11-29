import { useState, useRef, useContext } from "react";
import { useSearchParams } from "react-router";

import {
  Card,
  IconButton,
  Flex,
  Image,
  Text,
  Button,
  createListCollection,
  Dialog,
  Select,
  Portal,
} from "@chakra-ui/react";
import { useColorModeValue } from "./ui/color-mode";
import { LuSettings, LuX } from "react-icons/lu";

import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import type { Preferences } from "../lib/schema";
import { DEFAULT_PREFERENCES } from "../lib/schema";
import { HydrantContext } from "../lib/hydrant";

import logo from "../assets/logo.svg";
import logoDark from "../assets/logo-dark.svg";
import hydraAnt from "../assets/hydraAnt.png";
import { SIPBLogo } from "./SIPBLogo";

export function PreferencesDialog() {
  "use no memo";
  const { state, hydrantState } = useContext(HydrantContext);
  const { preferences: originalPreferences } = hydrantState;

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

  const collection = createListCollection({
    items: [
      { label: "System Default", value: "" },
      ...COLOR_SCHEME_PRESETS.map(({ name }) => ({
        label: name,
        value: name,
      })),
    ],
  });

  return (
    <>
      <Dialog.Root
        open={visible}
        onOpenChange={(e) => {
          if (e.open) {
            onOpen();
          } else {
            onCancel();
          }
        }}
      >
        <Dialog.Trigger asChild>
          <IconButton size="sm" aria-label="Change theme" variant="outline">
            <LuSettings />
          </IconButton>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Preferences</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Flex gap={4}>
                  <Select.Root
                    collection={collection}
                    value={[preferences.colorScheme?.name ?? ""]}
                    onValueChange={(e) => {
                      if (e.value[0] === "") {
                        previewPreferences({
                          ...preferences,
                          colorScheme: null,
                        });
                        return;
                      }

                      const colorScheme = COLOR_SCHEME_PRESETS.find(
                        ({ name }) => name === e.value[0],
                      );
                      if (!colorScheme) return;
                      previewPreferences({ ...preferences, colorScheme });
                    }}
                  >
                    <Select.HiddenSelect />
                    <Select.Label>Color scheme:</Select.Label>
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {collection.items.map((colorScheme) => (
                          <Select.Item
                            item={colorScheme}
                            key={colorScheme.value}
                          >
                            {colorScheme.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Flex>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button>Cancel</Button>
                </Dialog.ActionTrigger>
                <Button onClick={onConfirm}>Save</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

/** Header above the left column, with logo and semester selection. */
export function Header() {
  const { state } = useContext(HydrantContext);
  const logoSrc = useColorModeValue(logo, logoDark);
  const [searchParams, setSearchParams] = useSearchParams();

  const urlNameOrig = searchParams.get("ti");
  const urlName = searchParams.get("t") ?? state.latestUrlName;

  const [show, setShow] = useState(urlNameOrig !== null);

  const onClose = () => {
    setSearchParams((searchParams) => {
      searchParams.delete("ti");
      return searchParams;
    });
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
