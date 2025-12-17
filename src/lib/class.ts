import { Timeslot, Event } from "./activity";
import type { ColorScheme } from "./colors";
import { fallbackColor } from "./colors";
import {
  CI,
  GIR,
  HASS,
  Level,
  SectionKind,
  TermCode,
  type RawClass,
  type RawSection,
} from "./rawClass";

import nonextImg from "../assets/nonext.gif";
import underImg from "../assets/under.gif";
import gradImg from "../assets/grad.gif";
import fallImg from "../assets/fall.gif";
import iapImg from "../assets/iap.gif";
import springImg from "../assets/spring.gif";
import summerImg from "../assets/summer.gif";
import repeatImg from "../assets/repeat.gif";
import bioImg from "../assets/bio.gif";
import calc1Img from "../assets/calc1.gif";
import calc2Img from "../assets/calc2.gif";
import chemImg from "../assets/chem.gif";
import labImg from "../assets/lab.gif";
import partlabImg from "../assets/partLab.gif";
import phys1Img from "../assets/phys1.gif";
import phys2Img from "../assets/phys2.gif";
import restImg from "../assets/rest.gif";
import hassHImg from "../assets/hassH.gif";
import hassAImg from "../assets/hassA.gif";
import hassSImg from "../assets/hassS.gif";
import hassEImg from "../assets/hassE.gif";
import cihImg from "../assets/cih.gif";
import cihwImg from "../assets/cihw.gif";

/** Flags. */
export interface Flags {
  nonext: boolean;
  under: boolean;
  grad: boolean;
  fall: boolean;
  iap: boolean;
  spring: boolean;
  summer: boolean;
  repeat: boolean;
  bio: boolean;
  calc1: boolean;
  calc2: boolean;
  chem: boolean;
  lab: boolean;
  partLab: boolean;
  phys1: boolean;
  phys2: boolean;
  rest: boolean;
  hass: boolean;
  hassH: boolean;
  hassA: boolean;
  hassS: boolean;
  hassE: boolean;
  cih: boolean;
  cihw: boolean;
  notcih: boolean;
  cim: boolean;
  final: boolean;
  nofinal: boolean;
  nopreq: boolean;
  le9units: boolean;
  half: number | false;
  limited: boolean;
}

export const DARK_IMAGES: (keyof Flags)[] = [
  "calc1",
  "calc2",
  "chem",
  "cih",
  "cihw",
  "iap",
  "repeat",
  "rest",
];

const flagImages: { [k in keyof Flags]?: string } = {
  nonext: nonextImg,
  under: underImg,
  grad: gradImg,
  fall: fallImg,
  iap: iapImg,
  spring: springImg,
  summer: summerImg,
  repeat: repeatImg,
  bio: bioImg,
  calc1: calc1Img,
  calc2: calc2Img,
  chem: chemImg,
  lab: labImg,
  partLab: partlabImg,
  phys1: phys1Img,
  phys2: phys2Img,
  rest: restImg,
  hassH: hassHImg,
  hassA: hassAImg,
  hassS: hassSImg,
  hassE: hassEImg,
  cih: cihImg,
  cihw: cihwImg,
};

export const getFlagImg = (flag: keyof Flags): string => {
  return flagImages[flag] ?? "";
};

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
type TLockOption = (typeof LockOption)[keyof typeof LockOption];

/** All section options for a manual section time. */
export type SectionLockOption = Section | TLockOption;

/**
 * A group of {@link Section}s, all the same kind (like lec, rec, or lab). At
 * most one of these can be selected at a time, and that selection is possibly
 * locked.
 */
export class Sections {
  cls: Class;
  kind: SectionKind;
  sections: Section[];
  /** Are these sections locked? None counts as locked. */
  locked: boolean;
  /** Currently selected section out of these. None is null. */
  selected: Section | null;
  /** Overridden location for this particular section. */
  roomOverride = "";

  constructor(
    cls: Class,
    kind: SectionKind,
    rawTimes: string[],
    secs: RawSection[],
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
    switch (this.kind) {
      case SectionKind.LECTURE:
        return "lec";
      case SectionKind.RECITATION:
        return "rec";
      case SectionKind.LAB:
        return "lab";
      case SectionKind.DESIGN:
        return "des";
    }
  }

  get priority(): number {
    switch (this.kind) {
      case SectionKind.LECTURE:
        return 0;
      case SectionKind.RECITATION:
        return 1;
      case SectionKind.LAB:
        return 2;
      case SectionKind.DESIGN:
        return 3;
    }
  }

  /** Name for the kind of sections these are. */
  get name(): string {
    switch (this.kind) {
      case SectionKind.LECTURE:
        return "Lecture";
      case SectionKind.RECITATION:
        return "Recitation";
      case SectionKind.LAB:
        return "Lab";
      case SectionKind.DESIGN:
        return "Design";
    }
  }

  /** The event (possibly none) for this group of sections. */
  get event(): Event | null {
    return this.selected
      ? new Event(
          this.cls,
          `${this.cls.number} ${this.shortName}`,
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

/** An entire class, e.g. 6.036, and its selected sections. */
export class Class {
  /**
   * The RawClass being wrapped around. Nothing outside Class should touch
   * this; instead use the Class getters like cls.id, cls.number, etc.
   */
  readonly rawClass: RawClass;
  /** The sections associated with this class. */
  readonly sections: Sections[];
  /** The background color for the class, used for buttons and calendar. */
  backgroundColor: string;
  /** Is the color set by the user (as opposed to chosen automatically?) */
  manualColor = false;

  customLocation: string | undefined = undefined;

  constructor(rawClass: RawClass, colorScheme: ColorScheme) {
    this.rawClass = rawClass;
    this.sections = rawClass.sectionKinds
      .map((kind) => {
        switch (kind) {
          case SectionKind.LECTURE:
            return new Sections(
              this,
              SectionKind.LECTURE,
              rawClass.lectureRawSections,
              rawClass.lectureSections,
            );
          case SectionKind.RECITATION:
            return new Sections(
              this,
              SectionKind.RECITATION,
              rawClass.recitationRawSections,
              rawClass.recitationSections,
            );
          case SectionKind.LAB:
            return new Sections(
              this,
              SectionKind.LAB,
              rawClass.labRawSections,
              rawClass.labSections,
            );
          case SectionKind.DESIGN:
            return new Sections(
              this,
              SectionKind.DESIGN,
              rawClass.designRawSections,
              rawClass.designSections,
            );
        }
      })
      .sort((a, b) => a.priority - b.priority);
    this.backgroundColor = fallbackColor(colorScheme);
  }

  /** ID unique over all Activities. */
  get id(): string {
    return this.number;
  }

  /** Name, e.g. "Introduction to Machine Learning". */
  get name(): string {
    if (this.rawClass.oldNumber) {
      return `[${this.rawClass.oldNumber}] ${this.rawClass.name}`;
    }
    return this.rawClass.name;
  }

  /** Name that appears when it's on a button. */
  get buttonName(): string {
    return `${this.number}${this.warnings.suffix}`;
  }

  /** Number, e.g. "6.036". */
  get number(): string {
    return this.rawClass.number;
  }

  /** Old number, e.g. "6.036" for 6.3900. May or may not exist. */
  get oldNumber(): string | undefined {
    return this.rawClass.oldNumber;
  }

  /** Course, e.g. "6". */
  get course(): string {
    return this.rawClass.course;
  }

  /** Units [in class, lab, out of class]. */
  get units(): number[] {
    return [
      this.rawClass.lectureUnits,
      this.rawClass.labUnits,
      this.rawClass.preparationUnits,
    ];
  }

  /** Returns whether this class has a variable/arranged number of units. */
  get isVariableUnits(): boolean {
    return this.rawClass.isVariableUnits;
  }

  /** Total class units, usually 12. */
  get totalUnits(): number {
    return (
      this.rawClass.lectureUnits +
      this.rawClass.labUnits +
      this.rawClass.preparationUnits
    );
  }

  /** Hours per week, taking from evals if exists, or units if not. */
  get hours(): number {
    return !this.new && this.rawClass.hours
      ? this.rawClass.hours
      : this.totalUnits;
  }

  /** The half the class lies in; 1 if first, 2 if second, else undefined. */
  get half(): number | undefined {
    return this.rawClass.half || undefined;
  }

  /** Whether this class is new and should be highlighted as such. */
  get new(): boolean {
    return this.rawClass.new || false;
  }

  /** Get all calendar events corresponding to this class. */
  get events(): Event[] {
    return this.sections
      .map((secs) => secs.event)
      .filter((event): event is Event => event instanceof Event);
  }

  /** Object of boolean properties of class, used for filtering. */
  get flags(): Flags {
    return {
      nonext: this.rawClass.nonext,
      under: this.rawClass.level === Level.U,
      grad: this.rawClass.level === Level.G,
      fall: this.rawClass.terms.includes(TermCode.FA),
      iap: this.rawClass.terms.includes(TermCode.JA),
      spring: this.rawClass.terms.includes(TermCode.SP),
      summer: this.rawClass.terms.includes(TermCode.SU),
      repeat: this.rawClass.repeat,
      bio: this.rawClass.gir === GIR.BIOL,
      calc1: this.rawClass.gir === GIR.CAL1,
      calc2: this.rawClass.gir === GIR.CAL2,
      chem: this.rawClass.gir === GIR.CHEM,
      lab: this.rawClass.gir === GIR.LAB,
      partLab: this.rawClass.gir === GIR.LAB2,
      phys1: this.rawClass.gir === GIR.PHY1,
      phys2: this.rawClass.gir === GIR.PHY2,
      rest: this.rawClass.gir === GIR.REST,
      hass: this.rawClass.hass.length > 0,
      hassH: this.rawClass.hass.includes(HASS.H),
      hassA: this.rawClass.hass.includes(HASS.A),
      hassS: this.rawClass.hass.includes(HASS.S),
      hassE: this.rawClass.hass.includes(HASS.E),
      cih: this.rawClass.comms === CI.CIH,
      cihw: this.rawClass.comms === CI.CIHW,
      notcih: !this.rawClass.comms,
      cim: !!this.rawClass.cim?.length,
      final: this.rawClass.final,
      nofinal: !this.rawClass.final,
      nopreq: this.rawClass.prereqs === "None",
      le9units: this.totalUnits <= 9 && !this.isVariableUnits,
      half: this.rawClass.half,
      limited: this.rawClass.limited,
    };
  }

  /** Array of programs (free text) for which this class is a CI-M */
  get cim(): string[] {
    return this.rawClass.cim ?? [];
  }

  /** Evals, or N/A if non-existent. */
  get evals(): {
    rating: string;
    hours: string;
    people: string;
  } {
    if (this.rawClass.rating === 0 || this.new) {
      return {
        rating: "N/A",
        hours: "N/A",
        people: "N/A",
      };
    } else {
      return {
        rating: `${this.rawClass.rating.toFixed(1)}/7.0`,
        hours: this.rawClass.hours.toFixed(1),
        people: this.rawClass.size.toFixed(1),
      };
    }
  }

  /**
   * Related classes, in unspecified format, but likely to contain class
   * numbers as substrings.
   */
  get related(): {
    prereq: string;
    same: string;
    meets: string;
  } {
    return {
      prereq: this.rawClass.prereqs,
      same: this.rawClass.same,
      meets: this.rawClass.meets,
    };
  }

  get warnings(): {
    suffix: string;
    messages: string[];
  } {
    const suffixes: string[] = [];
    const messages: string[] = [];
    if (this.rawClass.tba) {
      suffixes.push("+");
      messages.push(
        "+ Class has at least one section yet to be scheduled—check course catalog.",
      );
    } else if (this.sections.length === 0) {
      suffixes.push("&");
      messages.push(
        "& Class schedule is unknown—check course catalog or department website.",
      );
    }
    if (this.rawClass.isVariableUnits) {
      if (!this.rawClass.hours || this.new) {
        suffixes.push("^");
        messages.push(
          "^ This class has an arranged number of units and no evaluations, so it was not counted towards total units or hours.",
        );
      } else {
        suffixes.push("#");
        messages.push(
          "# This class has an arranged number of units and its units were not counted in the total.",
        );
      }
    } else {
      if (!this.rawClass.hours || this.new) {
        suffixes.push("*");
        messages.push(
          "* Class does not have evaluations, so its hours were set to units.",
        );
      }
    }
    return { suffix: suffixes.join(""), messages };
  }

  /**
   * Class description and (person) in-charge. Extra URLs are labels and URLs
   * that should appear after the class description, like "Course Catalog" or
   * "Class Evaluations".
   */
  get description(): {
    description: string;
    inCharge: string;
    extraUrls: { label: string; url: string }[];
  } {
    const extraUrls = [
      {
        label: "Course Catalog",
        url: `http://student.mit.edu/catalog/search.cgi?search=${this.number}`,
      },
      {
        label: "Course Data on OpenGrades",
        url: `https://opengrades.mit.edu/classes/aggregate/${this.number}?utm_source=hydrant`,
      },
      {
        label: "Class Evaluations",
        url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=${this.number}`,
      },
    ];

    if (this.oldNumber) {
      extraUrls[extraUrls.length - 1].label =
        `Class Evaluations (for ${this.number})`;
      extraUrls.push({
        label: `Class Evaluations (for ${this.oldNumber})`,
        url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=${this.oldNumber}`,
      });
    }

    if (this.rawClass.url) {
      extraUrls.unshift({ label: "More Info", url: this.rawClass.url });
    }
    if (this.course === "6") {
      extraUrls.push({
        label: "HKN Underground Guide",
        url: `https://underground-guide.mit.edu/search?q=${this.oldNumber ?? this.number}`,
      });
    }
    if (this.course === "18") {
      extraUrls.push({
        label: "Course 18 Underground Guide",
        url: `https://mathguide.mit.edu/${this.number}`,
      });
    }

    return {
      description: this.rawClass.description,
      inCharge: this.rawClass.inCharge,
      extraUrls: extraUrls,
    };
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
      this.number,
      ...(this.manualColor ? [this.backgroundColor] : []), // string
      ...(sectionLocs.length ? [sectionLocs] : []), // array[string]
      ...(sections.length > 0 ? (sections as number[]) : []), // number
    ];
  }

  /** Inflate a class with info from the output of deflate. */
  inflate(parsed: string | (string | number | string[])[]): void {
    if (typeof parsed === "string") {
      // just the class number, ignore
      return;
    }
    // we ignore parsed[0] as that has the class number
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
