import {
  Group,
  createListCollection,
  Flex,
  Heading,
  Input,
  Text,
  parseColor,
  HStack,
  Stack,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";
import {
  ComponentPropsWithoutRef,
  FormEvent,
  useLayoutEffect,
  useState,
} from "react";

import { Radio, RadioGroup } from "./ui/radio";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./ui/select";
import { Field } from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import {
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerEyeDropper,
  ColorPickerChannelSlider,
  ColorPickerInput,
  ColorPickerRoot,
  ColorPickerTrigger,
} from "./ui/color-picker";

import { Activity, NonClass, Timeslot } from "../lib/activity";
import { Class, LockOption, SectionLockOption, Sections } from "../lib/class";
import { WEEKDAY_STRINGS, TIMESLOT_STRINGS, Slot } from "../lib/dates";
import { State } from "../lib/state";
import { LuCheck as CheckIcon, LuX as CloseIcon } from "react-icons/lu";

/**
 * A button that toggles the active value, and is outlined if active, solid
 * if not.
 */
function ToggleButton(
  props: ComponentPropsWithoutRef<"button"> & {
    active: boolean;
    handleClick: () => void;
  },
) {
  const { children, active, handleClick, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      onClick={handleClick}
      variant={active ? "outline" : "subtle"}
    >
      {children}
    </Button>
  );
}

function OverrideLocations(props: { state: State; secs: Sections }) {
  const [isOverriding, setIsOverriding] = useState(false);
  const { state, secs } = props;
  const [room, setRoom] = useState(secs.roomOverride);
  const onRelocate = () => {
    setIsOverriding(true);
    setRoom(secs.roomOverride);
  };
  const onConfirm = () => {
    secs.roomOverride = room.trim();
    setIsOverriding(false);
    state.updateActivities();
  };
  const onCancel = () => {
    setIsOverriding(false);
  };
  return isOverriding ? (
    <Flex gap={1} mr={1} mt={2}>
      <Input
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            onConfirm();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="26-100"
      />
      <Button onClick={onConfirm}>
        <CheckIcon />
      </Button>
      <Button onClick={onCancel}>
        <CloseIcon />
      </Button>
    </Flex>
  ) : (
    <Flex mt={2}>
      <Button onClick={onRelocate}>
        {secs.roomOverride ? "Change" : "Add"} custom location
      </Button>
    </Flex>
  );
}

/** Div containing section manual selection interface. */
function ClassManualSections(props: { cls: Class; state: State }) {
  const { cls, state } = props;
  const genSelected = (cls: Class) =>
    cls.sections.map((sections) =>
      sections.locked
        ? sections.selected
          ? sections.selected.rawTime
          : LockOption.None
        : LockOption.Auto,
    );
  const [selected, setSelected] = useState(genSelected(cls));
  useLayoutEffect(() => setSelected(genSelected(cls)), [cls]);

  const RenderOptions = () => {
    const getLabel = (sec: SectionLockOption, humanReadable?: boolean) => {
      if (sec === LockOption.Auto) {
        return humanReadable ? "Auto (default)" : LockOption.Auto;
      } else if (sec === LockOption.None) {
        return LockOption.None;
      } else {
        return humanReadable ? sec.parsedTime : sec.rawTime;
      }
    };

    return (
      <>
        {cls.sections.map((secs, sectionIndex) => {
          const options = [LockOption.Auto, LockOption.None, ...secs.sections];
          return (
            <Field key={secs.kind} label={secs.name}>
              <RadioGroup
                orientation="vertical"
                value={selected[sectionIndex]}
                onValueChange={(e) => {
                  setSelected((oldArray) => {
                    oldArray[sectionIndex] = e.value;
                    return oldArray;
                  });

                  if (e.value === LockOption.Auto) {
                    state.lockSection(secs, LockOption.Auto);
                    return;
                  }

                  if (e.value === LockOption.None) {
                    state.lockSection(secs, LockOption.None);
                    return;
                  }

                  const foundSec = secs.sections.find(
                    (sec) => sec.rawTime === e.value,
                  );

                  if (foundSec) {
                    state.lockSection(secs, foundSec);
                  }
                }}
              >
                <Stack>
                  {options.map((sec) => (
                    <Radio key={getLabel(sec)} value={getLabel(sec)}>
                      {getLabel(sec, true)}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
              <OverrideLocations secs={secs} state={state} />
            </Field>
          );
        })}
      </>
    );
  };

  return (
    <Flex>
      <RenderOptions />
    </Flex>
  );
}

/** Div containing color selection interface. */
function ActivityColor(props: {
  activity: Activity;
  state: State;
  onHide: () => void;
}) {
  const { activity, state, onHide } = props;
  const initColor = parseColor(activity.backgroundColor);
  const [color, setColor] = useState(initColor);

  const onReset = () => {
    state.setBackgroundColor(activity, undefined);
    onHide();
  };
  const onCancel = onHide;
  const onConfirm = () => {
    state.setBackgroundColor(activity, color.toString("rgb"));
    onHide();
  };

  return (
    <Flex gap={2}>
      <Flex direction="row" gap={2}>
        <ColorPickerRoot value={color} onValueChange={(e) => setColor(e.value)}>
          <ColorPickerControl>
            <ColorPickerInput autoFocus />
            <ColorPickerTrigger />
          </ColorPickerControl>
          <ColorPickerContent>
            <ColorPickerArea />
            <HStack>
              <ColorPickerEyeDropper />
              <ColorPickerChannelSlider channel="hue" />
            </HStack>
          </ColorPickerContent>
        </ColorPickerRoot>
        <ButtonGroup>
          <Button onClick={onReset}>Reset</Button>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </ButtonGroup>
      </Flex>
    </Flex>
  );
}

/** Buttons in class description to add/remove class, and lock sections. */
export function ClassButtons(props: { cls: Class; state: State }) {
  const { cls, state } = props;
  const [showManual, setShowManual] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const isSelected = state.isSelectedActivity(cls);

  return (
    <Flex direction="column" gap={2}>
      <ButtonGroup wrap="wrap">
        <Button onClick={() => state.toggleActivity(cls)}>
          {isSelected ? "Remove class" : "Add class"}
        </Button>
        {isSelected && (
          <ToggleButton
            active={showManual}
            handleClick={() => {
              setShowManual(!showManual);
              setShowColors(false); // untoggle colors
            }}
          >
            Edit sections
          </ToggleButton>
        )}
        {isSelected && (
          <ToggleButton
            active={showColors}
            handleClick={() => {
              setShowColors(!showColors);
              setShowManual(false); // untoggle manual section assignment
            }}
          >
            Edit color
          </ToggleButton>
        )}
      </ButtonGroup>
      {isSelected && showManual && (
        <ClassManualSections cls={cls} state={state} />
      )}
      {isSelected && showColors && (
        <ActivityColor
          activity={cls}
          state={state}
          onHide={() => setShowColors(false)}
        />
      )}
    </Flex>
  );
}

/** Form to add a timeslot to a non-class. */
function NonClassAddTime(props: { activity: NonClass; state: State }) {
  const { activity, state } = props;
  const [days, setDays] = useState(
    Object.fromEntries(WEEKDAY_STRINGS.map((day) => [day, false])),
  );
  const [times, setTimes] = useState({ start: "10:00 AM", end: "1:00 PM" });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    for (const day in days) {
      if (!days[day]) continue;
      state.addTimeslot(
        activity,
        Timeslot.fromStartEnd(
          Slot.fromDayString(day, times.start),
          Slot.fromDayString(day, times.end),
        ),
      );
    }
  };

  const RenderCheckboxes = () => {
    return (
      <>
        {WEEKDAY_STRINGS.map((day) => (
          <Checkbox
            key={day}
            checked={days[day]}
            onCheckedChange={(e) => setDays({ ...days, [day]: !!e.checked })}
          >
            {day}
          </Checkbox>
        ))}
      </>
    );
  };

  const renderTimeDropdown = (key: "start" | "end") => (
    <SelectRoot
      collection={createListCollection({
        items: TIMESLOT_STRINGS.map((time) => ({
          label: time,
          value: time,
        })),
      })}
      size="sm"
      width="8rem"
      value={[times[key]]}
      onValueChange={(e) => setTimes({ ...times, [key]: e.value[0] })}
    >
      <SelectTrigger>
        <SelectValueText />
      </SelectTrigger>
      <SelectContent>
        {TIMESLOT_STRINGS.map((time) => (
          <SelectItem item={time} key={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );

  return (
    <form onSubmit={onSubmit}>
      <Flex align="center" gap={2} wrap="wrap">
        <Button type="submit" size="sm">
          Add time
        </Button>
        <Group wrap="wrap">
          <RenderCheckboxes />
        </Group>
        <Flex align="center" gap={1}>
          {renderTimeDropdown("start")} to {renderTimeDropdown("end")}
        </Flex>
      </Flex>
    </form>
  );
}

/**
 * Buttons in non-class description to rename it, or add/edit/remove timeslots.
 */
export function NonClassButtons(props: { activity: NonClass; state: State }) {
  const { activity, state } = props;

  const isSelected = state.isSelectedActivity(activity);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRelocating, setIsRelocating] = useState(false);
  const [showColors, setShowColors] = useState(false);

  const [name, setName] = useState(activity.name);
  const [room, setRoom] = useState(activity.room);

  const RenderHeading = () => {
    if (isRenaming) {
      return (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          fontWeight="bold"
          placeholder="New Activity"
          autoFocus
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              onConfirmRename();
            } else if (e.key === "Escape") {
              onCancelRename();
            }
          }}
        />
      );
    } else if (isRelocating) {
      return (
        <Input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="W20-557"
          autoFocus
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              onConfirmRelocating();
            } else if (e.key === "Escape") {
              onCancelRelocating();
            }
          }}
        />
      );
    } else {
      return <Heading size="md">{activity.name}</Heading>;
    }
  };

  const onConfirmRename = () => {
    state.renameNonClass(activity, name);
    setIsRenaming(false);
  };
  const onCancelRename = () => {
    setIsRenaming(false);
  };

  const onConfirmRelocating = () => {
    state.relocateNonClass(activity, room);
    setIsRelocating(false);
  };
  const onCancelRelocating = () => {
    setIsRelocating(false);
  };
  const onRenameElse = () => {
    setName(activity.name);
    setIsRenaming(true);
  };
  const onRelocateElse = () => {
    setRoom(activity.room);
    setIsRelocating(true);
  };

  const RenderButtons = () => {
    if (isRenaming) {
      return (
        <>
          <Button onClick={onConfirmRename}>Confirm</Button>
          <Button onClick={onCancelRename}>Cancel</Button>
        </>
      );
    } else if (isRelocating) {
      return (
        <>
          <Button onClick={onConfirmRelocating}>Confirm</Button>
          <Button onClick={onCancelRelocating}>Cancel</Button>
        </>
      );
    } else {
      return (
        <>
          <Button onClick={() => state.toggleActivity(activity)}>
            {isSelected ? "Remove activity" : "Add activity"}
          </Button>
          <Button onClick={onRenameElse}>Rename activity</Button>
          <Button onClick={onRelocateElse}>Edit location</Button>
          {isSelected && (
            <ToggleButton
              active={showColors}
              handleClick={() => {
                setShowColors(!showColors);
              }}
            >
              Edit color
            </ToggleButton>
          )}
        </>
      );
    }
  };

  return (
    <Flex direction="column" gap={4}>
      {RenderHeading()}
      <ButtonGroup wrap="wrap">{RenderButtons()}</ButtonGroup>
      {isSelected && showColors && (
        <ActivityColor
          activity={activity}
          state={state}
          onHide={() => setShowColors(false)}
        />
      )}
      <Text>
        Click and drag on an empty time in the calendar to add the times for
        your activity. Or add one manually:
      </Text>
      <NonClassAddTime activity={activity} state={state} />
    </Flex>
  );
}
