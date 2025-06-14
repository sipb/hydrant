import {
  Box,
  Flex,
  IconButton,
  Input,
  Link,
  createListCollection,
  Button,
} from "@chakra-ui/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useContext, useEffect, useState } from "react";

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
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "./ui/menu";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectLabel,
} from "./ui/select";

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
      <SelectRoot
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
        <SelectLabel hidden>Select schedule</SelectLabel>
        <SelectTrigger>
          <SelectValueText />
        </SelectTrigger>
        <SelectContent>
          {scheduleCollection.items.map(({ label, value }) =>
            value != "" ? (
              <SelectItem item={value} key={value}>
                {label}
              </SelectItem>
            ) : null,
          )}
        </SelectContent>
      </SelectRoot>
      <DialogRoot
        open={Boolean(confirmSave)}
        onOpenChange={(e) => {
          if (!e.open) {
            setConfirmSave("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            The current schedule is loaded from a URL and is not saved. Are you
            sure you want to load schedule {confirmName} without saving your
            current schedule?
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button>Cancel</Button>
            </DialogActionTrigger>
            <Button
              onClick={() => {
                state.loadSave(confirmSave);
                setConfirmSave("");
              }}
            >
              Load schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
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
    <DialogRoot
      open={show}
      onOpenChange={(e) => {
        setShow(e.open);
      }}
      role="alertdialog"
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <DialogBody>Are you sure you want to delete {name}?</DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button>Cancel</Button>
          </DialogActionTrigger>
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
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function ExportDialog(props: { children: ReactNode }) {
  const { children } = props;
  const { state } = useContext(HydrantContext);
  const [show, setShow] = useState(false);
  const link = state.urlify();
  const [clipboardState, copyToClipboard] = useCopyToClipboard();

  return (
    <DialogRoot
      open={show}
      onOpenChange={(e) => {
        setShow(e.open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share schedule</DialogTitle>
        </DialogHeader>
        <DialogBody>
          Share the following link:
          <br />
          <Link href={link} colorPalette="blue" wordBreak="break-all">
            {link}
          </Link>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button>Close</Button>
          </DialogActionTrigger>
          <Button
            onClick={() => {
              copyToClipboard(link);
            }}
          >
            {clipboardState.value === link ? "Copied!" : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

export function ScheduleSwitcher() {
  const { state, hydrantState } = useContext(HydrantContext);
  const { saves, saveId } = hydrantState;

  const currentName = saves.find((save) => save.id === saveId)?.name ?? "";
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(currentName);
  const defaultScheduleId = state.defaultSchedule;

  useEffect(() => {
    setName(saves.find((save) => save.id === saveId)?.name ?? "");
  }, [saves, saveId]);

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
      <MenuRoot unmountOnExit={false}>
        <MenuTrigger asChild>
          <IconButton variant="outline" size="sm" aria-label="Schedule options">
            <LuEllipsis />
          </IconButton>
        </MenuTrigger>
        <MenuContent>
          {saveId && (
            <MenuItem value="rename" onClick={onRename}>
              <LuPencilLine />
              <Box flex="1">Rename&hellip;</Box>
            </MenuItem>
          )}
          <MenuItem value="copy" onClick={onCopy}>
            <LuCopy />
            <Box flex="1">Copy</Box>
          </MenuItem>
          {saveId && (
            <DeleteDialog
              saveId={saveId}
              name={saves.find((save) => save.id === saveId)?.name ?? ""}
            >
              <MenuItem
                value="delete"
                color="fg.error"
                _hover={{ bg: "bg.error", color: "fg.error" }}
              >
                <LuTrash2 />
                <Box flex="1">Delete&hellip;</Box>
              </MenuItem>
            </DeleteDialog>
          )}
          <MenuItem value="new" onClick={onSave}>
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
          </MenuItem>
          {saveId && (
            <MenuItem
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
            </MenuItem>
          )}
          <ExportDialog>
            <MenuItem value="share">
              <LuShare2 />
              <Box flex="1">Share</Box>
            </MenuItem>
          </ExportDialog>
        </MenuContent>
      </MenuRoot>
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
