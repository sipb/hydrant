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
} from "@chakra-ui/react";
import { ComponentPropsWithoutRef, FormEvent, useState } from "react";

import { Radio, RadioGroup } from "./ui/radio";
import { Button } from "./ui/button";
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
        placeholder="26-100"
      />
      <Button onClick={onConfirm} variant="subtle">
        <CheckIcon />
      </Button>
      <Button onClick={onCancel} variant="subtle">
        <CloseIcon />
      </Button>
    </Flex>
  ) : (
    <Flex mt={2}>
      <Button onClick={onRelocate} variant="subtle">
        {secs.roomOverride ? "Change" : "Add"} custom location
      </Button>
    </Flex>
  );
}

/** Div containing section manual selection interface. */
function ClassManualSections(props: { cls: Class; state: State }) {
  const { cls, state } = props;
  const [selected, setSelected] = useState(
    cls.sections.map((sections) =>
      sections.locked
        ? sections.selected
          ? sections.selected.rawTime
          : LockOption.None
        : LockOption.Auto,
    ),
  );

  const RenderOptions = () => {
    const getLabel = (sec: SectionLockOption) => {
      if (sec === LockOption.Auto) {
        return LockOption.Auto;
      } else if (sec === LockOption.None) {
        return LockOption.None;
      } else {
        return sec.rawTime;
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
                      {getLabel(sec) === LockOption.Auto
                        ? "Auto (default)"
                        : getLabel(sec)}
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
            <ColorPickerInput />
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
        <Group>
          <Button onClick={onReset} variant="subtle">
            Reset
          </Button>
          <Button onClick={onCancel} variant="subtle">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="subtle">
            Confirm
          </Button>
        </Group>
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
      <Group wrap="wrap">
        <Button onClick={() => state.toggleActivity(cls)} variant="subtle">
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
      </Group>
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
        <Button type="submit" size="sm" variant="subtle">
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

  const [RenderHeading, RenderButtons] = (() => {
    if (isRenaming) {
      const RenderHeading = () => (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          fontWeight="bold"
          placeholder="New Activity"
        />
      );
      const onConfirm = () => {
        state.renameNonClass(activity, name);
        setIsRenaming(false);
      };
      const onCancel = () => {
        setIsRenaming(false);
      };
      const renderButtons = () => (
        <>
          <Button onClick={onConfirm} variant="subtle">
            Confirm
          </Button>
          <Button onClick={onCancel} variant="subtle">
            Cancel
          </Button>
        </>
      );
      return [RenderHeading, renderButtons];
    } else if (isRelocating) {
      const RenderHeading = () => (
        <Input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="W20-557"
        />
      );
      const onConfirm = () => {
        state.relocateNonClass(activity, room);
        setIsRelocating(false);
      };
      const onCancel = () => {
        setIsRelocating(false);
      };
      const renderButtons = () => (
        <>
          <Button onClick={onConfirm} variant="subtle">
            Confirm
          </Button>
          <Button onClick={onCancel} variant="subtle">
            Cancel
          </Button>
        </>
      );
      return [RenderHeading, renderButtons];
    }

    const RenderHeading = () => <Heading size="sm">{activity.name}</Heading>;
    const onRename = () => {
      setName(activity.name);
      setIsRenaming(true);
    };
    const onRelocate = () => {
      setRoom(activity.room);
      setIsRelocating(true);
    };
    const renderButtons = () => (
      <>
        <Button onClick={() => state.toggleActivity(activity)} variant="subtle">
          {isSelected ? "Remove activity" : "Add activity"}
        </Button>
        <Button onClick={onRename} variant="subtle">
          Rename activity
        </Button>
        <Button onClick={onRelocate} variant="subtle">
          Edit location
        </Button>
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

    return [RenderHeading, renderButtons];
  })();

  return (
    <Flex direction="column" gap={4}>
      <RenderHeading />
      <Group wrap="wrap">
        <RenderButtons />
      </Group>
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
