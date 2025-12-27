/** The raw class format produced by the scraper. */
export interface RawClass {
  /** Class number, e.g. "6.3900" */
  number: string;
  /** Old class number, e.g. "6.036" */
  oldNumber?: string;
  /** Course number, e.g. "6" */
  course: string;
  /** Subject number without course, e.g. "3900" */
  subject: string;
  /** True if some section is not scheduled yet */
  tba: boolean;

  /** Kinds of sections (among LECTURE, RECITATION, LAB, DESIGN) that exist */
  sectionKinds: SectionKind[];
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

  /** Contains type of HASS (if any) */
  hass: HASS[];
  /** Type of CI class (if any) */
  comms: CI;
  /** Type of GIR (if any) */
  gir: GIR;

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
  level: Level;
  /**
   * Comma-separated list of classes with same number, e.g.
   * "21A.103, WGS.225"
   */
  same: string;
  /** Comma-separated list of classes it meets with */
  meets: string;

  /** Terms class is offered */
  terms: TermCode[];
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
  quarterInfo?: QuarterInfo;
  /** Included from override despite possible not being in catalog */
  include?: boolean;
}

/** Raw timeslot format: [start slot, length of timeslot]. */
export type RawTimeslot = [number, number];

/** Raw section format: [[[10, 2], [70, 2]], "34-101"]. */
export type RawSection = [RawTimeslot[], string];

/**
 * Communications Intensive designation
 */
export enum CI {
  /** Not CI-H */
  EMPTY = "",
  /** CI-H */
  CIH = "CI-H",
  /** CI-HW */
  CIHW = "CI-HW",
}

/**
 * GIR designation
 */
export enum GIR {
  /** Not a GIR */
  EMPTY = "",
  /** Biology */
  BIOL = "BIOL",
  /** Calculus 1 */
  CAL1 = "CAL1",
  /** Calculus 2 */
  CAL2 = "CAL2",
  /** Chemistry */
  CHEM = "CHEM",
  /** Institute Lab */
  LAB = "LAB",
  /** Partial Lab */
  LAB2 = "LAB2",
  /** Physics 1 */
  PHY1 = "PHY1",
  /** Physics 2 */
  PHY2 = "PHY2",
  /** REST */
  REST = "REST",
}

/**
 * HASS designation
 */
export enum HASS {
  /** HASS-H */
  H = "H",
  /** HASS-A */
  A = "A",
  /** HASS-S */
  S = "S",
  /** HASS-E */
  E = "E",
}

/**
 * Subject level ("U" or "G")
 */
export enum Level {
  /** Undergraduate */
  U = "U",
  /** Graduate */
  G = "G",
}

/** Information about start and end month + days of the quarter. */
export interface QuarterInfo {
  start?: [number, number];
  end?: [number, number];
}

/** Kinds of sections */
export enum SectionKind {
  LECTURE = "lecture",
  RECITATION = "recitation",
  LAB = "lab",
  DESIGN = "design",
}

/** Term codes */
export enum TermCode {
  /** Fall */
  FA = "FA",
  /** January (IAP) */
  JA = "JA",
  /** Spring */
  SP = "SP",
  /** Summer */
  SU = "SU",
}
