import { Flex, Input, Link, createListCollection } from "@chakra-ui/react";
import { ComponentPropsWithoutRef, useState } from "react";

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
import { Button } from "./ui/button";

import { State } from "../lib/state";
import { Save } from "../lib/schema";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectLabel,
} from "./ui/select";

import { useCopyToClipboard } from "react-use";

function SmallButton(props: ComponentPropsWithoutRef<"button">) {
  const { children, ...otherProps } = props;
  return (
    <Button {...otherProps} variant="outline" size="sm">
      {children}
    </Button>
  );
}

function SelectWithWarn(props: {
  state: State;
  saveId: string;
  saves: Array<Save>;
}) {
  const { state, saveId, saves } = props;
  const [confirmSave, setConfirmSave] = useState("");
  const confirmName = saves.find((save) => save.id === confirmSave)?.name;
  return (
    <>
      <SelectRoot
        collection={createListCollection({
          items: [
            { label: "Not saved", value: "" },
            ...saves.map(({ id, name }) => ({ label: name, value: id })),
          ],
        })}
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
          {saves.map(({ id, name }) => (
            <SelectItem item={id} key={id}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      <DialogRoot
        lazyMount
        open={Boolean(confirmSave)}
        onOpenChange={(e) => (!e.open ? setConfirmSave("") : null)}
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

function DeleteDialog(props: { state: State; saveId: string; name: string }) {
  const { state, saveId, name } = props;
  const [show, setShow] = useState(false);

  return (
    <>
      <DialogRoot lazyMount open={show} onOpenChange={(e) => setShow(e.open)}>
        <DialogTrigger asChild>
          <SmallButton>Delete</SmallButton>
        </DialogTrigger>
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
    </>
  );
}

function ExportDialog(props: { state: State }) {
  const { state } = props;
  const [show, setShow] = useState(false);
  const link = state.urlify();
  const [clipboardState, copyToClipboard] = useCopyToClipboard();

  return (
    <>
      <DialogRoot lazyMount open={show} onOpenChange={(e) => setShow(e.open)}>
        <DialogTrigger asChild>
          <SmallButton>Share</SmallButton>
        </DialogTrigger>
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
            <Button onClick={() => copyToClipboard(link)}>
              {clipboardState.value === link ? "Copied!" : "Copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export function ScheduleSwitcher(props: {
  saveId: string;
  saves: Array<Save>;
  state: State;
}) {
  const { saveId, saves, state } = props;

  const currentName = saves.find((save) => save.id === saveId)?.name ?? "";
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(currentName);

  const [renderHeading, renderButtons] = (() => {
    if (isRenaming) {
      const renderHeading = () => (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
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
      <SelectWithWarn state={state} saveId={saveId} saves={saves} />
    );
    const onRename = () => setIsRenaming(true);
    const onSave = () => state.addSave(Boolean(saveId));
    const onCopy = () => state.addSave(false, `${currentName} copy`);
    const renderButtons = () => (
      <>
        {saveId && <SmallButton onClick={onRename}>Rename</SmallButton>}
        <SmallButton onClick={onCopy}>Copy</SmallButton>
        {saveId && (
          <DeleteDialog
            state={state}
            saveId={saveId}
            name={saves.find((save) => save.id === saveId)!.name}
          />
        )}
        <SmallButton onClick={onSave}>{saveId ? "New" : "Save"}</SmallButton>
        <ExportDialog state={state} />
      </>
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
