/** Raw timeslot format: [start slot, length of timeslot]. */
export type RawTimeslot = [number, number];

/** Raw section format: [[[10, 2], [70, 2]], "34-101"]. */
export type RawSection = [RawTimeslot[], string];

/** The raw class format produced by the scraper. */
export interface RawClass {
  /** Class number, e.g. "6.3900" */
  number: string;
  /** Old class number, e.g. "6.036" */
  oldNumber: string;
  /** Course number, e.g. "6" */
  course: string;
  /** Subject number without course, e.g. "3900" */
  subject: string;
  /** True if some section is not scheduled yet */
  tba: boolean;

  /** Kinds of sections (among LECTURE, RECITATION, LAB, DESIGN) that exist */
  sectionKinds: ("lecture" | "recitation" | "lab" | "design")[];
  /** Lecture timeslots and rooms */
  lectureSections: RawSection[];
  /** Recitation timeslots and rooms */
  recitationSections: RawSection[];
  /** Lab timeslots and rooms */
  labSections: RawSection[];
  /** Design timeslots and rooms */
  designSections: RawSection[];
  /** Raw lecture times, e.g. T9.301-11 or TR1,F2 */
  lectureRawSections: string[];
  /** Raw recitation times, e.g. T9.301-11 or TR1,F2 */
  recitationRawSections: string[];
  /** Raw lab times, e.g. T9.301-11 or TR1,F2 */
  labRawSections: string[];
  /** Raw design times, e.g. T9.301-11 or TR1,F2 */
  designRawSections: string[];

  /** True if HASS-H */
  hassH: boolean;
  /** True if HASS-A */
  hassA: boolean;
  /** True if HASS-S */
  hassS: boolean;
  /** True if HASS-E */
  hassE: boolean;
  /** True if CI-H */
  cih: boolean;
  /** True if CI-HW */
  cihw: boolean;
  /** True if REST */
  rest: boolean;
  /** True if institute lab */
  lab: boolean;
  /** True if partial institute lab */
  partLab: boolean;

  /** Array of programs (free text) for which this class is a CI-M */
  cim?: string[];

  /** Lecture or recitation units */
  lectureUnits: number;
  /** Lab or field work units */
  labUnits: number;
  /** Outside class units */
  preparationUnits: number;
  /**
   * Does this class have an arranged number of units?
   * If true, lectureUnits, labUnits, preparationUnits are set to zero.
   */
  isVariableUnits: boolean;

  /** Level: "U" undergrad, "G" grad */
  level: "U" | "G";
  /**
   * Comma-separated list of classes with same number, e.g.
   * "21A.103, WGS.225"
   */
  same: string;
  /** Comma-separated list of classes it meets with */
  meets: string;

  /** Terms class is offered */
  terms: ("FA" | "JA" | "SP" | "SU")[];
  /** Prereqs, no specific format (but usually contains class numbers) */
  prereqs: string;

  /** Description (~paragraph that appears in catalog) */
  description: string;
  /** Name of class e.g. "Algebra I" */
  name: string;
  /** (Person) in-charge, e.g. "Alyssa Hacker" */
  inCharge: string;

  /** True if meeting virtually */
  virtualStatus: boolean;

  /** True if NOT offered next year */
  nonext: boolean;
  /** True if can be repeated for credit */
  repeat: boolean;
  /** Class website */
  url: string;
  /** True if has final */
  final: boolean;
  /** 1 or 2 if first / second half */
  half: number | false;
  /** True if limited enrollment */
  limited: boolean;
  /** True if subject is new */
  new: boolean;

  /** Rating (out of 7.0) from evals */
  rating: number;
  /** Hours per week from evals */
  hours: number;
  /** Class size from evals */
  size: number;

  /** Record with start and end time information */
  quarterInfo?: Partial<Record<"start" | "end", [number, number]>>;
}
