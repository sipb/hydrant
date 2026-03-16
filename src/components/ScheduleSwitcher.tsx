import {
  Box,
  Flex,
  IconButton,
  Input,
  Link,
  createListCollection,
  Button,
  Dialog,
  Select,
  Menu,
  Portal,
} from "@chakra-ui/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useContext, useState } from "react";

import type { Save } from "../lib/schema";
import { HydrantContext } from "../lib/hydrant";

import {
  LuCopy,
  LuEllipsis,
  LuFilePlus2,
  LuPencilLine,
  LuPin,
  LuPinOff,
  LuSave,
  LuShare2,
  LuTrash2,
} from "react-icons/lu";

import useCopyToClipboard from "react-use/lib/useCopyToClipboard.js";

function SmallButton(props: ComponentPropsWithoutRef<"button">) {
  const { children, ...otherProps } = props;
  return (
    <Button {...otherProps} variant="outline" size="sm">
      {children}
    </Button>
  );
}

function SelectWithWarn(props: { saveId: string; saves: Save[] }) {
  const { saveId, saves } = props;
  const { state } = useContext(HydrantContext);
  const [confirmSave, setConfirmSave] = useState("");
  const confirmName = saves.find((save) => save.id === confirmSave)?.name;
  const defaultScheduleId = state.defaultSchedule;

  const formatScheduleName = (id: string, name: string) => {
    return id === defaultScheduleId ? `${name} (default)` : name;
  };

  const scheduleCollection = createListCollection({
    items: [
      { label: "Not saved", value: "" },
      ...saves.map(({ id, name }) => ({
        label: formatScheduleName(id, name),
        value: id,
      })),
    ],
  });

  return (
    <>
      <Select.Root
        collection={scheduleCollection}
        size="sm"
        width="fit-content"
        minWidth="10em"
        display="inline-block"
        value={[saveId]}
        onValueChange={(e) => {
          if (!saveId) {
            setConfirmSave(e.value[0]);
          } else {
            state.loadSave(e.value[0]);
          }
        }}
      >
        <Select.HiddenSelect />
        <Select.Label hidden>Select schedule</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {scheduleCollection.items.map(({ label, value }) =>
                value != "" ? (
                  <Select.Item item={value} key={value}>
                    {label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ) : null,
              )}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Dialog.Root
        open={Boolean(confirmSave)}
        onOpenChange={(e) => {
          if (!e.open) {
            setConfirmSave("");
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Are you sure?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                The current schedule is loaded from a URL and is not saved. Are
                you sure you want to load schedule {confirmName} without saving
                your current schedule?
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button>Cancel</Button>
                </Dialog.ActionTrigger>
                <Button
                  onClick={() => {
                    state.loadSave(confirmSave);
                    setConfirmSave("");
                  }}
                >
                  Load schedule
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

function DeleteDialog(props: {
  saveId: string;
  name: string;
  children: ReactNode;
}) {
  const { saveId, name, children } = props;
  const { state } = useContext(HydrantContext);
  const [show, setShow] = useState(false);

  return (
    <Dialog.Root
      open={show}
      onOpenChange={(e) => {
        setShow(e.open);
      }}
      role="alertdialog"
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Are you sure?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>Are you sure you want to delete {name}?</Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button>Cancel</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="red"
                variant="solid"
                onClick={() => {
                  state.removeSave(saveId);
                  setShow(false);
                }}
              >
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function ExportDialog(props: { children: ReactNode }) {
  const { children } = props;
  const { state } = useContext(HydrantContext);
  const [show, setShow] = useState(false);
  const link = state.urlify();
  const [clipboardState, copyToClipboard] = useCopyToClipboard();

  return (
    <Dialog.Root
      open={show}
      onOpenChange={(e) => {
        setShow(e.open);
      }}
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Share schedule</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Share the following link:
              <br />
              <Link href={link} colorPalette="blue" wordBreak="break-all">
                {link}
              </Link>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button>Close</Button>
              </Dialog.ActionTrigger>
              <Button
                onClick={() => {
                  copyToClipboard(link);
                }}
              >
                {clipboardState.value === link ? "Copied!" : "Copy"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export function ScheduleSwitcher() {
  const { state, hydrantState } = useContext(HydrantContext);
  const { saves, saveId } = hydrantState;

  const currentName = saves.find((save) => save.id === saveId)?.name ?? "";
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(currentName);
  const defaultScheduleId = state.defaultSchedule;

  const [prevSaves, setPrevSaves] = useState(saves);
  const [prevSaveId, setPrevSaveId] = useState(saveId);

  if (prevSaves !== saves) {
    setPrevSaves(saves);
    setName(saves.find((save) => save.id === saveId)?.name ?? "");
  }

  if (prevSaveId !== saveId) {
    setPrevSaveId(saveId);
    setName(saves.find((save) => save.id === saveId)?.name ?? "");
  }

  const [renderHeading, renderButtons] = (() => {
    if (isRenaming) {
      const renderHeading = () => (
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          autoFocus
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              onConfirm();
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          placeholder="New Schedule"
          size="sm"
          width="fit-content"
        />
      );
      const onConfirm = () => {
        state.renameSave(saveId, name);
        setIsRenaming(false);
      };
      const onCancel = () => {
        setName(currentName);
        setIsRenaming(false);
      };
      const renderButtons = () => (
        <>
          <SmallButton onClick={onConfirm}>Confirm</SmallButton>
          <SmallButton onClick={onCancel}>Cancel</SmallButton>
        </>
      );
      return [renderHeading, renderButtons];
    }

    const renderHeading = () => (
      <SelectWithWarn saveId={saveId} saves={saves} />
    );
    const onRename = () => {
      setIsRenaming(true);
    };
    const onSave = () => {
      state.addSave(Boolean(saveId));
    };
    const onCopy = () => {
      state.addSave(false, `${currentName} copy`);
    };
    const renderButtons = () => (
      <Menu.Root unmountOnExit={false}>
        <Menu.Trigger asChild>
          <IconButton variant="outline" size="sm" aria-label="Schedule options">
            <LuEllipsis />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              {saveId && (
                <Menu.Item value="rename" onClick={onRename}>
                  <LuPencilLine />
                  <Box flex="1">Rename&hellip;</Box>
                </Menu.Item>
              )}
              <Menu.Item value="copy" onClick={onCopy}>
                <LuCopy />
                <Box flex="1">Make a copy</Box>
              </Menu.Item>
              {saveId && (
                <DeleteDialog
                  saveId={saveId}
                  name={saves.find((save) => save.id === saveId)?.name ?? ""}
                >
                  <Menu.Item
                    value="delete"
                    color="fg.error"
                    _hover={{ bg: "bg.error", color: "fg.error" }}
                  >
                    <LuTrash2 />
                    <Box flex="1">Delete&hellip;</Box>
                  </Menu.Item>
                </DeleteDialog>
              )}
              <Menu.Item value="new" onClick={onSave}>
                {saveId ? (
                  <>
                    <LuFilePlus2 />
                    <Box flex="1">New</Box>
                  </>
                ) : (
                  <>
                    <LuSave />
                    <Box flex="1">Save</Box>
                  </>
                )}
              </Menu.Item>
              {saveId && (
                <Menu.Item
                  value="toggleDefault"
                  onClick={() => {
                    state.defaultSchedule =
                      defaultScheduleId === saveId ? null : saveId;
                  }}
                >
                  {defaultScheduleId === saveId ? (
                    <>
                      <LuPinOff />
                      <Box flex="1">Unset as default</Box>
                    </>
                  ) : (
                    <>
                      <LuPin />
                      <Box flex="1">Set as default</Box>
                    </>
                  )}
                </Menu.Item>
              )}
              <ExportDialog>
                <Menu.Item value="share">
                  <LuShare2 />
                  <Box flex="1">Share</Box>
                </Menu.Item>
              </ExportDialog>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
    return [renderHeading, renderButtons];
  })();

  return (
    <Flex align="center" justify="center" wrap="wrap" gap={2}>
      {renderHeading()}
      {renderButtons()}
    </Flex>
  );
}
