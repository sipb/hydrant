import {
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useClipboard,
} from "@chakra-ui/react";
import { ComponentProps, useState } from "react";

import { State } from "../lib/state";
import { Save } from "../lib/schema";

function SmallButton(props: ComponentProps<"button">) {
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
      <Select
        value={saveId}
        size="sm"
        onChange={(e) => {
          if (!saveId) {
            setConfirmSave(e.target.value);
          } else {
            state.loadSave(e.target.value);
          }
        }}
        width="fit-content"
        minWidth="10em"
        display="inline-block"
      >
        {!saveId && <option value="">Not saved</option>}
        {saves.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </Select>
      <Modal isOpen={Boolean(confirmSave)} onClose={() => setConfirmSave("")}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you sure?</ModalHeader>
          <ModalBody>
            The current schedule is loaded from a URL and is not saved. Are you
            sure you want to load schedule {confirmName} without saving your
            current schedule?
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setConfirmSave("")} mr={2}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                state.loadSave(confirmSave);
                setConfirmSave("");
              }}
            >
              Load schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function DeleteModal(props: {
  state: State;
  saveId: string;
  name: string;
}) {
  const { state, saveId, name } = props;
  const [show, setShow] = useState(false);

  return (
    <>
      <SmallButton onClick={() => setShow(true)}>Delete</SmallButton>
      <Modal isOpen={show} onClose={() => setShow(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you sure?</ModalHeader>
          <ModalBody>Are you sure you want to delete {name}?</ModalBody>
          <ModalFooter>
            <Button onClick={() => setShow(false)} mr={2}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                state.removeSave(saveId);
                setShow(false);
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function ExportModal(props: { state: State }) {
  const { state } = props;
  const [show, setShow] = useState(false);
  const link = state.urlify();
  const { hasCopied, onCopy } = useClipboard(link);

  return (
    <>
      <SmallButton onClick={() => setShow(true)}>Share</SmallButton>
      <Modal isOpen={show} onClose={() => setShow(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share schedule</ModalHeader>
          <ModalBody>
            Share the following link:
            <br />
            <a href={link}>{link}</a>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShow(false)} mr={2}>
              Close
            </Button>
            <Button onClick={() => onCopy()}>
              {hasCopied ? "Copied!" : "Copy"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export function ScheduleSwitcher(props: {
  saveId: string;
  saves: Array<Save>;
  state: State;
}) {
  const { saveId, saves, state } = props;

  const currentName = saves.find((save) => save.id === saveId)?.name!;
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
          <DeleteModal
            state={state}
            saveId={saveId}
            name={saves.find((save) => save.id === saveId)!.name}
          />
        )}
        <SmallButton onClick={onSave}>{saveId ? "New" : "Save"}</SmallButton>
        <ExportModal state={state} />
      </>
    );
    return [renderHeading, renderButtons];
  })();

  return (
    <Flex align="center" justify="center" gap={2}>
      {renderHeading()}
      {renderButtons()}
    </Flex>
  );
}
