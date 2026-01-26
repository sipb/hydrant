import type { EventInput } from "@fullcalendar/core";
import { nanoid } from "nanoid";

import type { ColorScheme } from "./colors";
import { fallbackColor, textColor } from "./colors";
import { Slot } from "./dates";
import type { RawSection, RawTimeslot } from "./raw";
import { sum } from "./utils";
import type { PEClass } from "./pe";
import type { Class } from "./class";

/** A period of time, spanning several Slots. */
export class Timeslot {
  startSlot: Slot;
  numSlots: number;

  constructor(startSlot: number, numSlots: number) {
    this.startSlot = Slot.fromSlotNumber(startSlot);
    this.numSlots = numSlots;
  }

  /** Construct a timeslot from [startSlot, endSlot). */
  static fromStartEnd(startSlot: Slot, endSlot: Slot): Timeslot {
    return new Timeslot(startSlot.slot, endSlot.slot - startSlot.slot);
  }

  /** The first slot after this Timeslot, or the exclusive end slot. */
  get endSlot(): Slot {
    return this.startSlot.add(this.numSlots);
  }

  /** The start time, on the week of 2001-01-01. */
  get startTime(): Date {
    return this.startSlot.startDate;
  }

  /** The end time, on the week of 2001-01-01. */
  get endTime(): Date {
    return this.endSlot.startDate;
  }

  /** The number of hours this timeslot spans. */
  get hours(): number {
    return this.numSlots / 2;
  }

  /**
   * @param other - timeslot to compare to
   * @returns True if this timeslot conflicts with the other timeslot
   */
  conflicts(other: Timeslot): boolean {
    return (
      this.startSlot.slot < other.endSlot.slot &&
      other.startSlot.slot < this.endSlot.slot
    );
  }

  /** Convert to string of the form "Mon, 9:30 AM – 11:00 AM". */
  toString(): string {
    return `${this.startSlot.dayString}, ${this.startSlot.timeString} – ${this.endSlot.timeString}`;
  }

  /** @returns True if this timeslot is equal to other timeslot */
  equals(other: Timeslot): boolean {
    return this.startSlot === other.startSlot && this.endSlot === other.endSlot;
  }
}

/**
 * Shared interface for all types of activities,
 * including classes, PE classes, and custom activities.
 */
export interface BaseActivity {
  id: string;
  name: string;
  backgroundColor: string;
  manualColor: boolean;
  hours: number;
  buttonName: string;
  warnings?: {
    suffix: string;
    messages: string[];
  };
  events: Event[];
  start?: [number, number];
  end?: [number, number];
  deflate(): unknown;
  inflate?(parsed: unknown): void;
  half?: number;
}

export type Activity = Class | PEClass | CustomActivity;

/**
 * A group of events to be rendered in a calendar, all of the same name, room,
 * and color.
 */
export class Event {
  /** The parent activity owning the event. */
  activity: BaseActivity;
  /** The name of the event. */
  name: string;
  /** All slots of the event. */
  slots: Timeslot[];
  /** The room of the event. */
  room?: string;
  /** If defined, 1 -> first half; 2 -> second half. */
  half?: number;

  constructor(
    activity: BaseActivity,
    name: string,
    slots: Timeslot[],
    room?: string,
    half?: number,
  ) {
    this.activity = activity;
    this.name = name;
    this.slots = slots;
    this.room = room;
    this.half = half;
  }

  /** List of events that can be directly given to FullCalendar. */
  get eventInputs(): EventInput[] {
    const color = this.activity.backgroundColor;
    return this.slots.map((slot) => ({
      textColor: textColor(color),
      title: this.name,
      start: slot.startTime,
      end: slot.endTime,
      backgroundColor: color,
      borderColor: color,
      room: this.room,
      activity: this.activity,
    }));
  }
}

/** A custom activity, created by the user. */
export class CustomActivity implements BaseActivity {
  /** ID unique over all Activities. */
  readonly id: string;
  name = "New Activity";
  /** The background color for the activity, used for buttons and calendar. */
  backgroundColor: string;
  /** Is the color set by the user (as opposed to chosen automatically?) */
  manualColor = false;
  timeslots: Timeslot[] = [];
  room: string | undefined = undefined;

  constructor(colorScheme: ColorScheme) {
    this.id = nanoid(8);
    this.backgroundColor = fallbackColor(colorScheme);
  }

  /** Name that appears when it's on a button. */
  get buttonName(): string {
    return this.name;
  }

  /** Hours per week. */
  get hours(): number {
    return sum(this.timeslots.map((slot) => slot.hours));
  }

  /** Get all calendar events corresponding to this activity. */
  get events(): Event[] {
    return [new Event(this, this.name, this.timeslots, this.room)];
  }

  /**
   * Add a timeslot to this custom activity spanning from startDate to
   * endDate. Dates must be within 8 AM to 9 PM. Will not add if equal to
   * existing timeslot. Will not add if slot spans multiple days.
   */
  addTimeslot(slot: Timeslot): void {
    if (
      this.timeslots.find((slot_) => slot_.equals(slot)) ||
      slot.startTime.getDate() !== slot.endTime.getDate()
    )
      return;
    this.timeslots.push(slot);
  }

  /** Remove a given timeslot from the custom activity. */
  removeTimeslot(slot: Timeslot): void {
    this.timeslots = this.timeslots.filter((slot_) => !slot_.equals(slot));
  }

  /** Deflate an activity to something JSONable. */
  deflate(): (RawTimeslot[] | string)[] {
    const res = [
      this.timeslots.map<RawTimeslot>((slot) => [
        slot.startSlot.slot,
        slot.numSlots,
      ]),
      this.name,
      this.backgroundColor,
      this.room ?? "",
    ];
    return res;
  }

  /** Inflate a custom activity with info from the output of deflate. */
  inflate(parsed: (RawTimeslot[] | string)[]): void {
    const [timeslots, name, backgroundColor, room] = parsed;
    this.timeslots = (timeslots as RawTimeslot[]).map(
      (slot) => new Timeslot(...slot),
    );
    this.name = name as string;
    this.room = (room as string) || undefined;
    if (backgroundColor) {
      this.manualColor = true;
      this.backgroundColor = backgroundColor as string;
    }
  }
}

/**
 * A section is an array of timeslots that meet in the same room for the same
 * purpose. Sections can be lectures, recitations, or labs, for a given class.
 * All instances of Section belong to a Sections.
 */
export class Section {
  /** Group of sections this section belongs to */
  secs: Sections;
  /** Timeslots this section meets */
  timeslots: Timeslot[];
  /** String representing raw timeslots, e.g. MW9-11 or T2,F1. */
  rawTime: string;
  /** Room this section meets in */
  room: string;

  /** @param section - raw section info (timeslot and room) */
  constructor(secs: Sections, rawTime: string, section: RawSection) {
    this.secs = secs;
    this.rawTime = rawTime;
    const [rawSlots, room] = section;
    this.timeslots = rawSlots.map((slot) => new Timeslot(...slot));
    this.room = room;
  }

  /** Get the parsed time for this section in a format similar to the Registrar. */
  get parsedTime(): string {
    const [room, days, eveningBool, times] = this.rawTime.split("/");

    const isEvening = eveningBool === "1";

    if (isEvening) {
      return `${days} EVE (${times}) (${room})`;
    }

    return `${days}${times} (${room})`;
  }

  /**
   * @param currentSlots - array of timeslots currently occupied
   * @returns number of conflicts this section has with currentSlots
   */
  countConflicts(currentSlots: Timeslot[]): number {
    let conflicts = 0;
    for (const slot of this.timeslots) {
      for (const otherSlot of currentSlots) {
        conflicts += slot.conflicts(otherSlot) ? 1 : 0;
      }
    }
    return conflicts;
  }
}

/** The non-section options for a manual section time. */
export const LockOption = {
  Auto: "Auto",
  None: "None",
} as const;

/** The type of {@link LockOption}. */
export type TLockOption = (typeof LockOption)[keyof typeof LockOption];

/** All section options for a manual section time. */
export type SectionLockOption = Section | TLockOption;

/**
 * A group of {@link Section}s, all the same kind (like lec, rec, or lab). At
 * most one of these can be selected at a time, and that selection is possibly
 * locked.
 */
export class Sections {
  cls: BaseActivity;
  kind?: string;
  sections: Section[];
  /** Are these sections locked? None counts as locked. */
  locked: boolean;
  /** Currently selected section out of these. None is null. */
  selected: Section | null;
  /** Overridden location for this particular section. */
  roomOverride = "";

  constructor(
    cls: BaseActivity,
    rawTimes: string[],
    secs: RawSection[],
    kind?: string,
    locked?: boolean,
    selected?: Section | null,
  ) {
    this.cls = cls;
    this.kind = kind;
    this.sections = secs.map((sec, i) => new Section(this, rawTimes[i], sec));
    this.locked = locked ?? false;
    this.selected = selected ?? null;
  }

  /** Short name for the kind of sections these are. */
  get shortName(): string {
    return this.kind ? this.kind.toLowerCase() : "sec";
  }

  private readonly _priority = 0;
  get priority(): number {
    return this._priority;
  }

  /** Name for the kind of sections these are. */
  get name(): string {
    return this.kind ?? "Section";
  }

  /** Full display name for this section on the calendar. */
  get longName(): string {
    return `${this.cls.id} ${this.shortName}`;
  }

  /** The event (possibly none) for this group of sections. */
  get event(): Event | null {
    return this.selected
      ? new Event(
          this.cls,
          this.longName,
          this.selected.timeslots,
          this.roomOverride || this.selected.room,
          this.cls.half,
        )
      : null;
  }

  /** Lock a specific section of this class. Does not validate. */
  lockSection(sec: SectionLockOption): void {
    if (sec === LockOption.Auto) {
      this.locked = false;
    } else if (sec === LockOption.None) {
      this.locked = true;
      this.selected = null;
    } else {
      this.locked = true;
      this.selected = sec;
    }
  }
}
