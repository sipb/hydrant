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
} from "@chakra-ui/react";
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

import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import type { Preferences } from "../lib/schema";
import { DEFAULT_PREFERENCES } from "../lib/schema";
import { HydrantContext } from "../lib/hydrant";

import logo from "../assets/logo.svg";
import logoDark from "../assets/logo-dark.svg";
import hydraAnt from "../assets/hydraAnt.png";
import { SIPBLogo } from "./SIPBLogo";

export function PreferencesDialog() {
  const { hydrant: state, state: hydrantState } = useContext(HydrantContext);

  if (!state) {
    throw new Error("Hydrant context is undefined");
  }
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
                <SelectLabel>Color scheme:</SelectLabel>
                <SelectTrigger>
                  <SelectValueText />
                </SelectTrigger>
                <SelectContent portalled={false}>
                  {collection.items.map(({ label, value }) => (
                    <SelectItem item={value} key={value}>
                      {label}
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
export function Header() {
  const { hydrant } = useContext(HydrantContext);
  if (!hydrant) {
    throw new Error("Hydrant context is undefined");
  }
  const state = hydrant;
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
