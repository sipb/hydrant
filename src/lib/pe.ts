import { Section, Sections, type BaseActivity } from "./activity";
import { type RawPEClass, type RawSection } from "./raw";
import { Event } from "./activity";
import { fallbackColor, type ColorScheme } from "./colors";

export const W35_PLUS_TEXT =
  "W31, W32, W33, W34 and W35 are all connected. Enter through W35.";

export interface PEFlags {
  wellness: boolean;
  pirate: boolean;
  swim: boolean;
  remote: boolean;
  nofee: boolean;
  nopreq: boolean;
}

const peFlagEmojis: { [k in keyof PEFlags]?: string } = {
  wellness: "🔮",
  pirate: "🏴‍☠️",
  swim: "🌊",
  remote: "💻",
};

export const getPEFlagEmoji = (flag: keyof PEFlags): string => {
  return peFlagEmojis[flag] ?? "";
};

export class PESection extends Section {
  sectionNumber: string;

  constructor(
    secs: PESections,
    rawTime: string,
    section: RawSection,
    sectionNumber: string,
  ) {
    super(secs, rawTime, section);
    this.sectionNumber = sectionNumber;
  }
}

export class PESections extends Sections {
  declare cls: PEClass;
  declare sections: PESection[];
  declare selected: PESection | null;

  constructor(
    cls: BaseActivity,
    rawTimes: string[],
    secs: RawSection[],
    sectionNumbers: string[],
    kind?: string,
    locked?: boolean,
    selected?: Section | null,
  ) {
    super(cls, rawTimes, secs, kind, locked, selected);
    this.sections = secs.map(
      (sec, i) => new PESection(this, rawTimes[i], sec, sectionNumbers[i]),
    );
  }

  public get longName() {
    return this.selected
      ? `${this.cls.id}-${this.selected.sectionNumber}`
      : this.cls.id;
  }

  get priority(): number {
    return -1;
  }

  get event(): Event | null {
    const room = this.roomOverride || this.selected?.room;
    return this.selected
      ? new Event(
          this.cls,
          this.longName,
          this.selected.timeslots,
          room,
          undefined,
          room?.includes("W35+") ? W35_PLUS_TEXT : undefined,
        )
      : null;
  }
}

/**
 * PE&W activity placeholder
 */
export class PEClass implements BaseActivity {
  backgroundColor: string;
  manualColor = false;
  readonly rawClass: RawPEClass;
  readonly sections: PESections[];

  constructor(rawClass: RawPEClass, colorScheme: ColorScheme) {
    this.rawClass = rawClass;
    this.backgroundColor = fallbackColor(colorScheme);
    this.sections = [
      new PESections(
        this,
        rawClass.rawSections,
        rawClass.sections,
        rawClass.sectionNumbers,
      ),
    ];
  }

  /** ID unique over all Activities. */
  get id(): string {
    return this.rawClass.number;
  }

  /** Name; e.g. "Swimming, Beginner". */
  get name(): string {
    return this.rawClass.name;
  }

  /** Hours per week. */
  get hours(): number {
    return this.rawClass.points;
  }

  get warnings(): {
    suffix: string;
    messages: string[];
  } {
    return {
      suffix: "%",
      messages: [
        "% PE classes don't have evaluations, so hours were set to PE point values.",
      ],
    };
  }

  /** Name that appears when it's on a button. */
  get buttonName(): string {
    return `${this.rawClass.number}${this.warnings.suffix}`;
  }

  get startDate() {
    return new Date(this.rawClass.startDate);
  }

  get endDate() {
    return new Date(this.rawClass.endDate);
  }

  /** Fee, in dollars */
  get fee(): number {
    const fee = this.rawClass.fee;
    if (!fee.startsWith("$")) {
      console.error("Fee not in dollars:", fee);
    }
    const feeAmt = Number(fee.slice(1));
    if (isNaN(feeAmt)) {
      console.error("Non-numerical fee:", fee);
    }
    return feeAmt;
  }

  get events(): Event[] {
    return this.sections
      .map((secs) => secs.event)
      .filter((event): event is Event => event instanceof Event);
  }

  get start(): [number, number] {
    const startDate = new Date(this.rawClass.startDate);
    return [startDate.getMonth() + 1, startDate.getDate()];
  }

  get end(): [number, number] {
    const endDate = new Date(this.rawClass.endDate);
    return [endDate.getMonth() + 1, endDate.getDate()];
  }

  get flags(): PEFlags {
    return {
      wellness: this.rawClass.wellness,
      pirate: this.rawClass.pirate,
      swim: this.rawClass.swimGIR,
      remote: this.rawClass.remote,
      nofee: this.fee == 0,
      nopreq: this.rawClass.prereqs == "None",
    };
  }

  get description() {
    return {
      description: this.rawClass.description,
      inCharge: this.rawClass.inCharge,
      extraUrls: [],
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
