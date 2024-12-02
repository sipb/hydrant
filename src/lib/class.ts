import { Timeslot, Event } from "./activity";
import { ColorScheme, fallbackColor } from "./colors";
import { RawClass, RawSection } from "./rawClass";

import nonextImg from "../assets/nonext.gif";
import underImg from "../assets/under.gif";
import gradImg from "../assets/grad.gif";
import fallImg from "../assets/fall.gif";
import iapImg from "../assets/iap.gif";
import springImg from "../assets/spring.gif";
import summerImg from "../assets/summer.gif";
import repeatImg from "../assets/repeat.gif";
import restImg from "../assets/rest.gif";
import labImg from "../assets/Lab.gif";
import partlabImg from "../assets/PartLab.gif";
import cihImg from "../assets/cih.gif";
import cihwImg from "../assets/cihw.gif";
import hassHImg from "../assets/hassH.gif";
import hassAImg from "../assets/hassA.gif";
import hassSImg from "../assets/hassS.gif";
import hassEImg from "../assets/hassE.gif";

// This isn't exported intentionally. Instead of using this, can you use
// Sections directly?
enum SectionKind {
  LECTURE,
  RECITATION,
  LAB,
  DESIGN,
}

/** Flags. */
export type Flags = {
  nonext: boolean;
  under: boolean;
  grad: boolean;
  fall: boolean;
  iap: boolean;
  spring: boolean;
  summer: boolean;
  repeat: boolean;
  rest: boolean;
  Lab: boolean;
  PartLab: boolean;
  hass: boolean;
  hassH: boolean;
  hassA: boolean;
  hassS: boolean;
  hassE: boolean;
  cih: boolean;
  cihw: boolean;
  notcih: boolean;
  final: boolean;
  nofinal: boolean;
  nopreq: boolean;
  le9units: boolean;
  half: number | false;
  limited: boolean;
};

export const DARK_IMAGES = ["cih", "iap", "repeat", "rest"];

const flagImages: { [k in keyof Flags]?: string } = {
  nonext: nonextImg,
  under: underImg,
  grad: gradImg,
  fall: fallImg,
  iap: iapImg,
  spring: springImg,
  summer: summerImg,
  repeat: repeatImg,
  rest: restImg,
  Lab: labImg,
  PartLab: partlabImg,
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
  timeslots: Array<Timeslot>;
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

  /**
   * @param currentSlots - array of timeslots currently occupied
   * @returns number of conflicts this section has with currentSlots
   */
  countConflicts(currentSlots: Array<Timeslot>): number {
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
  sections: Array<Section>;
  /** Are these sections locked? None counts as locked. */
  locked: boolean;
  /** Currently selected section out of these. None is null. */
  selected: Section | null;
  /** Overridden location for this particular section. */
  roomOverride: string = "";

  constructor(
    cls: Class,
    kind: SectionKind,
    rawTimes: Array<string>,
    secs: Array<RawSection>,
    locked?: boolean,
    selected?: Section | null,
  ) {
    this.cls = cls;
    this.kind = kind;
    this.sections = secs.map((sec, i) => new Section(this, rawTimes[i]!, sec));
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
      case SectionKind.DESIGN:
        return "des";
      default:
        return "lab";
    }
  }

  /** Name for the kind of sections these are. */
  get name(): string {
    switch (this.kind) {
      case SectionKind.LECTURE:
        return "Lecture";
      case SectionKind.RECITATION:
        return "Recitation";
      case SectionKind.DESIGN:
        return "Design";
      default:
        return "Lab";
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
  readonly sections: Array<Sections>;
  /** The background color for the class, used for buttons and calendar. */
  backgroundColor: string;
  /** Is the color set by the user (as opposed to chosen automatically?) */
  manualColor: boolean = false;

  customLocation: string | undefined = undefined;

  constructor(rawClass: RawClass, colorScheme: ColorScheme) {
    this.rawClass = rawClass;
    this.sections = rawClass.sectionKinds
      .map((kind) => {
        switch (kind) {
          case "lecture":
            return new Sections(
              this,
              SectionKind.LECTURE,
              rawClass.lectureRawSections,
              rawClass.lectureSections,
            );
          case "recitation":
            return new Sections(
              this,
              SectionKind.RECITATION,
              rawClass.recitationRawSections,
              rawClass.recitationSections,
            );
          case "design":
            return new Sections(
              this,
              SectionKind.DESIGN,
              rawClass.designRawSections,
              rawClass.designSections,
            );
          default:
            return new Sections(
              this,
              SectionKind.LAB,
              rawClass.labRawSections,
              rawClass.labSections,
            );
        }
      })
      .sort((a, b) => a.kind - b.kind);
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
  get units(): Array<number> {
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
    return this.rawClass.hours || this.totalUnits;
  }

  /** The half the class lies in; 1 if first, 2 if second, else undefined. */
  get half(): number | undefined {
    return this.rawClass.half || undefined;
  }

  /** Get all calendar events corresponding to this class. */
  get events(): Array<Event> {
    return this.sections
      .map((secs) => secs.event)
      .filter((event): event is Event => event instanceof Event);
  }

  /** Object of boolean properties of class, used for filtering. */
  get flags(): Flags {
    return {
      nonext: this.rawClass.nonext,
      under: this.rawClass.level === "U",
      grad: this.rawClass.level === "G",
      fall: this.rawClass.terms.includes("FA"),
      iap: this.rawClass.terms.includes("JA"),
      spring: this.rawClass.terms.includes("SP"),
      summer: this.rawClass.terms.includes("SU"),
      repeat: this.rawClass.repeat,
      rest: this.rawClass.rest,
      Lab: this.rawClass.lab,
      PartLab: this.rawClass.partLab,
      hass:
        this.rawClass.hassH ||
        this.rawClass.hassA ||
        this.rawClass.hassS ||
        this.rawClass.hassE,
      hassH: this.rawClass.hassH,
      hassA: this.rawClass.hassA,
      hassS: this.rawClass.hassS,
      hassE: this.rawClass.hassE,
      cih: this.rawClass.cih,
      cihw: this.rawClass.cihw,
      notcih: !this.rawClass.cih && !this.rawClass.cihw,
      final: this.rawClass.final,
      nofinal: !this.rawClass.final,
      nopreq: this.rawClass.prereqs === "None",
      le9units: this.totalUnits <= 9 && !this.isVariableUnits,
      half: this.rawClass.half,
      limited: this.rawClass.limited,
    };
  }

  /** Evals, or N/A if non-existent. */
  get evals(): {
    rating: string;
    hours: string;
    people: string;
  } {
    if (this.rawClass.rating === 0) {
      return {
        rating: "N/A",
        hours: "N/A",
        people: "N/A",
      };
    } else {
      return {
        rating: `${this.rawClass.rating.toFixed(1)}/7.0`,
        hours: `${this.rawClass.hours.toFixed(1)}`,
        people: `${this.rawClass.size.toFixed(1)}`,
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
    messages: Array<string>;
  } {
    const suffixes: Array<string> = [];
    const messages: Array<string> = [];
    if (this.rawClass.tba) {
      suffixes.push("+");
      messages.push(
        "+ Class has at least one section yet to be scheduled—check course catalog.",
      );
    }
    if (this.rawClass.isVariableUnits) {
      if (this.rawClass.hours === 0) {
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
      if (this.rawClass.hours === 0) {
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
    extraUrls: Array<{ label: string; url: string }>;
  } {
    const extraUrls = [
      {
        label: "Course Catalog",
        url: `http://student.mit.edu/catalog/search.cgi?search=${this.number}`,
      },
      {
        label: "Class Evaluations",
        url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=${this.number}`,
      },
    ];

    if (this.oldNumber) {
      extraUrls.at(-1)!.label = `Class Evaluations (for ${this.number})`;
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
        url: `http://course18.guide/${this.number}-spring-2021.html`,
      });
    }

    return {
      description: this.rawClass.description,
      inCharge: this.rawClass.inCharge,
      extraUrls: extraUrls,
    };
  }

  /** Doesn't actually do anything (yet?), just makes compiler happy. */
  addTimeslot(startDate: Date, endDate: Date): void {}

  /** Doesn't actually do anything (yet?), just makes compiler happy. */
  removeTimeslot(slot: Timeslot): void {}

  /** Deflate a class to something JSONable. */
  deflate(): any {
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
      ...(sections.length > 0 ? sections : []), // number
    ];
  }

  /** Inflate a class with info from the output of deflate. */
  inflate(parsed: any): void {
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
    let sectionLocs: Array<any> | null = null;
    if (Array.isArray(parsed[offset])) {
      sectionLocs = parsed[offset];
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
        secs.selected = secs.sections[parse];
      }
    });
  }
}
