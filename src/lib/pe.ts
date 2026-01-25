import { Sections, type BaseActivity } from "./activity";
import { type RawPEClass } from "./raw";
import { Event } from "./activity";
import { fallbackColor, type ColorScheme } from "./colors";

export interface PEFlags {
  wellness: boolean;
  pirate: boolean;
  nofee: boolean;
  nopreq: boolean;
}

const peFlagEmojis: { [k in keyof PEFlags]?: string } = {
  wellness: "🔮",
  pirate: "🏴‍☠️",
};

export const getPEFlagEmoji = (flag: keyof PEFlags): string => {
  return peFlagEmojis[flag] ?? "";
};

const PIRATE_CLASSES = [
  // ARCHERY
  "PE.0600",
  "PE.0639",
  // FENCING
  "PE.0602",
  "PE.0654",
  "PE.0603",
  // SAILING
  "PE.0904",
];

export class PESections extends Sections {
  declare cls: PEClass;

  private readonly _shortName = "pe";
  public get shortName() {
    return this._shortName;
  }

  readonly priority = -1;

  private readonly _name = "PE and Wellness";
  public get name() {
    return this._name;
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
      new PESections(this, rawClass.rawSections, rawClass.sections),
    ];
  }

  get id(): string {
    return this.rawClass.number;
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
      wellness: this.id.startsWith("PE.05") || this.id.startsWith("PE.4"),
      pirate: PIRATE_CLASSES.includes(this.id),
      nofee: this.rawClass.fee == "$0.00",
      nopreq: this.rawClass.prereqs == "None",
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
