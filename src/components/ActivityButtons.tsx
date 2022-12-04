import {
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Radio,
  Select,
  Text,
} from "@chakra-ui/react";
import { ComponentProps, FormEvent, useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

import { Activity, NonClass, Timeslot } from "../lib/activity";
import { textColor } from "../lib/colors";
import { Class, LockOption, SectionLockOption, Sections } from "../lib/class";
import { WEEKDAY_STRINGS, TIMESLOT_STRINGS, Slot } from "../lib/dates";
import { State } from "../lib/state";

/**
 * A button that toggles the active value, and is outlined if active, solid
 * if not.
 */
function ToggleButton(
  props: ComponentProps<"button"> & {
    active: boolean;
    setActive: (value: boolean) => void;
  }
) {
  const { children, active, setActive, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      onClick={() => setActive(!active)}
      variant={active ? "outline" : "solid"}
    >
      {children}
    </Button>
  );
}

/** A single, manual section option, under {@link ClassManualSections}. */
function ClassManualOption(props: {
  secs: Sections;
  sec: SectionLockOption;
  state: State;
}) {
  const { secs, sec, state } = props;
  const [isChecked, label] = (() => {
    if (sec === LockOption.Auto) {
      return [!secs.locked, "Auto (default)"];
    } else if (sec === LockOption.None) {
      return [secs.selected === null, "None"];
    } else {
      return [secs.locked && secs.selected === sec, sec.rawTime];
    }
  })();

  return (
    <Radio
      isChecked={isChecked}
      onChange={() => state.lockSection(secs, sec)}
    >
      {label}
    </Radio>
  );
}

/** Div containing section manual selection interface. */
function ClassManualSections(props: { cls: Class; state: State }) {
  const { cls, state } = props;

  const renderOptions = () => {
    return cls.sections.map((secs) => {
      const options = [LockOption.Auto, LockOption.None, ...secs.sections];
      return (
        <FormControl key={secs.kind}>
          <FormLabel>{secs.name}</FormLabel>
          <Flex direction="column">
            {options.map((sec, i) => (
              <ClassManualOption
                key={i}
                secs={secs}
                sec={sec}
                state={state}
              />
            ))}
          </Flex>
        </FormControl>
      );
    });
  };

  return <Flex>{renderOptions()}</Flex>;
}

/** Div containing color selection interface. */
function ActivityColor(props: {
  activity: Activity;
  state: State;
  onHide: () => void;
}) {
  const { activity, state, onHide } = props;
  const initColor = activity.backgroundColor;
  const [color, setColor] = useState(initColor);

  const onReset = () => {
    state.setBackgroundColor(activity, undefined);
    onHide();
  };
  const onCancel = onHide;
  const onConfirm = () => {
    state.setBackgroundColor(activity, color);
    onHide();
  };

  return (
    <Flex gap={2}>
      <HexColorPicker color={color} onChange={setColor} />
      <Flex direction="column" gap={2}>
        <HexColorInput
          color={color}
          onChange={setColor}
          prefixed
          style={{
            backgroundColor: color,
            borderColor: color,
            color: textColor(color),
            cursor: "text",
          }}
          className="chakra-button css-1d0ox2v" // FIXME
        />
        <Button onClick={onReset}>Reset</Button>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
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
      <ButtonGroup>
        <Button onClick={() => state.toggleActivity(cls)}>
          {isSelected ? "Remove class" : "Add class"}
        </Button>
        {isSelected && (
          <ToggleButton active={showManual} setActive={setShowManual}>
            Edit sections
          </ToggleButton>
        )}
        {isSelected && (
          <ToggleButton active={showColors} setActive={setShowColors}>
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
    Object.fromEntries(WEEKDAY_STRINGS.map((day) => [day, false]))
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
          Slot.fromDayString(day, times.end)
        )
      );
    }
  };

  const renderCheckboxes = () => {
    return WEEKDAY_STRINGS.map((day) => (
      <Checkbox
        key={day}
        checked={days[day]}
        onChange={(e) => setDays({ ...days, [day]: e.target.checked })}
      >
        {day}
      </Checkbox>
    ));
  };

  const renderTimeDropdown = (key: "start" | "end") => (
    <Select
      value={times[key]}
      onChange={(e) => setTimes({ ...times, [key]: e.target.value })}
      size="sm"
    >
      {TIMESLOT_STRINGS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </Select>
  );

  return (
    <form onSubmit={onSubmit}>
      <Flex align="center" gap={2}>
        <Button type="submit" size="sm">
          Add time
        </Button>
        {renderCheckboxes()}
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
export function NonClassButtons(props: {
  activity: NonClass;
  state: State;
}) {
  const { activity, state } = props;

  const isSelected = state.isSelectedActivity(activity);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(activity.name);
  const [showColors, setShowColors] = useState(false);

  const [renderHeading, renderButtons] = (() => {
    if (isRenaming) {
      const renderHeading = () => (
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
          <Button onClick={onConfirm}>Confirm</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </>
      );
      return [renderHeading, renderButtons];
    }

    const renderHeading = () => <Heading size="sm">{activity.name}</Heading>;
    const onRename = () => {
      setName(activity.name);
      setIsRenaming(true);
    };
    const renderButtons = () => (
      <>
        <Button onClick={() => state.toggleActivity(activity)}>
          {isSelected ? "Remove activity" : "Add activity"}
        </Button>
        <Button onClick={onRename}>Rename activity</Button>
        {isSelected && (
          <ToggleButton active={showColors} setActive={setShowColors}>
            Edit color
          </ToggleButton>
        )}
      </>
    );

    return [renderHeading, renderButtons];
  })();

  return (
    <Flex direction="column" gap={4}>
      {renderHeading()}
      <ButtonGroup>{renderButtons()}</ButtonGroup>
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
