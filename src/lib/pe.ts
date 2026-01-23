import {
  Timeslot,
  type Activity,
  type Section,
  type Sections,
  LockOption,
  type TLockOption,
} from "./activity";
import type { RawPEClass } from "./rawPEClass";
import { Event } from "./activity";
import { fallbackColor, type ColorScheme } from "./colors";
import { TermCode, type RawSection } from "./rawClass";

export const QUARTERS: Record<number, TermCode> = {
  1: TermCode.FA,
  2: TermCode.FA,
  3: TermCode.SP,
  4: TermCode.SP,
  5: TermCode.JA,
};

export type PESectionLockOption = PESection | TLockOption;

export class PESection implements Section {
  /** Group of sections this section belongs to */
  secs: PESections;
  /** Timeslots this section meets */
  timeslots: Timeslot[];
  /** String representing raw timeslots, e.g. MW9-11 or T2,F1. */
  rawTime: string;
  /** Room this section meets in */
  room: string;

  /** @param section - raw section info (timeslot and room) */
  constructor(secs: PESections, rawTime: string, section: RawSection) {
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

export class PESections implements Sections {
  cls: PEClass;
  sections: PESection[];
  /** Are these sections locked? None counts as locked. */
  locked: boolean;
  /** Currently selected section out of these. None is null. */
  selected: PESection | null;
  /** Overridden location for this particular section. */
  roomOverride = "";

  constructor(
    cls: PEClass,
    rawTimes: string[],
    secs: RawSection[],
    locked?: boolean,
    selected?: PESection | null,
  ) {
    this.cls = cls;
    this.sections = secs.map((sec, i) => new PESection(this, rawTimes[i], sec));
    this.locked = locked ?? false;
    this.selected = selected ?? null;
  }

  /** Short name for the kind of sections these are. */
  readonly shortName = "pe";

  readonly priority = -1;

  /** Name for the kind of sections these are. */
  readonly name = "PE and Wellness";

  /** The event (possibly none) for this group of sections. */
  get event(): Event | null {
    return this.selected
      ? new Event(
          this.cls,
          `${this.cls.id} ${this.shortName}`,
          this.selected.timeslots,
          this.roomOverride || this.selected.room,
        )
      : null;
  }

  /** Lock a specific section of this class. Does not validate. */
  lockSection(sec: PESectionLockOption): void {
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

/**
 * PE&W activity placeholder
 */
export class PEClass implements Activity {
  backgroundColor: string;
  manualColor = false;
  readonly rawClass: RawPEClass;
  readonly sections: PESections[];

  constructor(rawClass: RawPEClass, colorScheme: ColorScheme) {
    this.rawClass = rawClass;
    this.backgroundColor = fallbackColor(colorScheme);
    this.sections = [
      new PESections(this, rawClass.rawSections, rawClass.sections),
    ];
  }

  get id(): string {
    return this.rawClass.number;
  }

  /** Hours per week. */
  readonly hours = 2;

  get buttonName(): string {
    return this.rawClass.number;
  }

  get events(): Event[] {
    return [];
  }

  get start(): [number, number] {
    const startDate = new Date(this.rawClass.startDate);
    return [startDate.getMonth() + 1, startDate.getDate()];
  }

  get end(): [number, number] {
    const endDate = new Date(this.rawClass.endDate);
    return [endDate.getMonth() + 1, endDate.getDate()];
  }

   /** Deflate a class to something JSONable. */
  deflate() {
    const sections = this.sections.map((secs) =>
      !secs.locked
        ? null
        : secs.sections.findIndex((sec) => sec === secs.selected),
    );
    const sectionLocs = this.sections.map((secs) => secs.roomOverride);
    while (sections.at(-1) === null) sections.pop();
    return [
      this.id,
      ...(this.manualColor ? [this.backgroundColor] : []), // string
      ...(sectionLocs.length ? [sectionLocs] : []), // array[string]
      ...(sections.length > 0 ? (sections as number[]) : []), // number
    ];
  }

  inflate(parsed: string | (string | number | string[])[]): void {
    if (typeof parsed === "string") {
      // just the class id, ignore
      return;
    }
    // we ignore parsed[0] as that has the class id
    let offset = 1;
    if (typeof parsed[1] === "string") {
      offset += 1;
      this.backgroundColor = parsed[1];
      this.manualColor = true;
    }
    let sectionLocs: (string | number | string[])[] | null = null;
    if (Array.isArray(parsed[offset])) {
      sectionLocs = parsed[offset] as string[];
      offset += 1;
    }
    this.sections.forEach((secs, i) => {
      if (sectionLocs && typeof sectionLocs[i] === "string") {
        secs.roomOverride = sectionLocs[i];
      }
      const parse = parsed[i + offset];
      if (!parse && parse !== 0) {
        secs.locked = false;
      } else {
        secs.locked = true;
        secs.selected = secs.sections[parse as number];
      }
    });
  }
}
