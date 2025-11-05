/** Dictionary of semester-name related constants. */
const SEMESTER_NAMES = {
  f: {
    catalog: "FA",
    full: "fall",
    fullCaps: "Fall",
  },
  s: {
    catalog: "SP",
    full: "spring",
    fullCaps: "Spring",
  },
  i: {
    catalog: "JA",
    full: "iap",
    fullCaps: "IAP",
  },
  m: {
    catalog: "SU",
    full: "summer",
    fullCaps: "Summer",
  },
} as const;

const TIMESLOTS = 34;

/** Type of semester abbreviations. */
export type TSemester = keyof typeof SEMESTER_NAMES;

/** Strings for each weekday. */
export const WEEKDAY_STRINGS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** See {@link TIMESLOT_STRINGS}. */
function generateTimeslotStrings(): string[] {
  const res = [];
  for (let i = 6; i <= 11; i++) {
    res.push(`${i.toString()}:00 AM`);
    res.push(`${i.toString()}:30 AM`);
  }
  res.push("12:00 PM");
  res.push("12:30 PM");
  for (let i = 1; i <= 9; i++) {
    res.push(`${i.toString()}:00 PM`);
    res.push(`${i.toString()}:30 PM`);
  }
  res.push(`10:00 PM`);
  return res;
}

/** Strings for each slot number, in order. */
export const TIMESLOT_STRINGS = generateTimeslotStrings();

/** We maintain only one copy of each slot object. */
const SLOT_OBJECTS: Record<number, Slot> = {};

/**
 * A thirty-minute slot. Each day has 34 slots from 6 AM to 11 PM, times five
 * days a week. When treated as an instant, a slot represents its start time.
 *
 * Each slot is assigned a slot number. Monday slots are 0 to 33, Tuesday are
 * 34 to 67, etc., slot number 0 is Monday 6 AM to 6:30 AM, etc.
 *
 * The interface ends at 11 PM, so we don't need to worry about the fencepost
 * problem with respect to ending slots.
 */
export class Slot {
  /** @param slot The slot number. */
  constructor(public slot: number) {}

  static fromSlotNumber(slot: number): Slot {
    if (!(slot in SLOT_OBJECTS)) {
      SLOT_OBJECTS[slot] = new Slot(slot);
    }
    return SLOT_OBJECTS[slot];
  }

  /** Converts a date, within 6 AM to 11 PM, to a slot. */
  static fromStartDate(date: Date): Slot {
    return new Slot(
      TIMESLOTS * (date.getDay() - 1) +
        2 * (date.getHours() - 6) +
        Math.floor(date.getMinutes() / 30),
    );
  }

  /** Convert from WEEKDAY_STRINGS and TIMESLOT_STRINGS to slot. */
  static fromDayString(day: string, time: string): Slot {
    return Slot.fromSlotNumber(
      TIMESLOTS * WEEKDAY_STRINGS.indexOf(day) + TIMESLOT_STRINGS.indexOf(time),
    );
  }

  /** The slot after #slots. */
  add(slots: number): Slot {
    return Slot.fromSlotNumber(this.slot + slots);
  }

  /**
   * The (local timezone) date on the day of date that this starts in. Assumes
   * that date is the right day of the week.
   */
  onDate(date: Date): Date {
    const hour = Math.floor((this.slot % TIMESLOTS) / 2) + 6;
    const minute = (this.slot % 2) * 30;
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute,
    );
  }

  /** The date in the week of 2001-01-01 that this starts in. */
  get startDate(): Date {
    // conveniently enough, 2001-01-01 is a Monday:
    return this.onDate(new Date(2001, 0, this.weekday));
  }

  /** The date in the week of 2001-01-01 that this ends in. */
  get endDate(): Date {
    return this.add(1).startDate;
  }

  /** The day of the week this slot falls in, as a number from 1 to 5. */
  get weekday(): number {
    return Math.floor(this.slot / TIMESLOTS) + 1;
  }

  /** Convert a slot number to a day string. */
  get dayString(): string {
    return WEEKDAY_STRINGS[this.weekday - 1];
  }

  /** Convert a slot number to a time string. */
  get timeString(): string {
    return TIMESLOT_STRINGS[this.slot % TIMESLOTS];
  }
}

/** Parse a urlName like "f22". */
export function parseUrlName(urlName: string): {
  year: string;
  semester: TSemester;
} {
  return {
    year: urlName.substring(1),
    semester: urlName[0] as TSemester,
  };
}

/** Given a urlName like i22, return its corresponding URL. */
export function toFullUrl(urlName: string, latestUrlName: string): string {
  const url = new URL(window.location.href);
  Array.from(url.searchParams.keys()).forEach((key) => {
    url.searchParams.delete(key);
  });
  if (urlName !== latestUrlName) {
    url.searchParams.set("t", urlName);
  }
  return url.href;
}

/** Given a urlName like "i22", return the previous one, "f21". */
function getLastUrlName(urlName: string): string {
  const { semester, year } = new Term({ urlName });
  switch (semester) {
    case "f":
      return `m${year}`;
    case "m":
      return `s${year}`;
    case "s":
      return `i${year}`;
    case "i":
      return `f${(parseInt(year, 10) - 1).toString()}`;
  }
}

/** Given a urlName like "i22", return the next one, "s22". */
function getNextUrlName(urlName: string): string {
  const { semester, year } = new Term({ urlName });
  switch (semester) {
    case "i":
      return `s${year}`;
    case "s":
      return `m${year}`;
    case "m":
      return `f${year}`;
    case "f":
      return `i${(parseInt(year, 10) + 1).toString()}`;
  }
}

/** urlNames that don't have a State */
const EXCLUDED_URLS = ["i23", "m23", "i24", "m24"];

/** Earliest urlName we have a State for. */
const EARLIEST_URL = "f22";

/** Return all urlNames before the given one. */
export function getUrlNames(latestUrlName: string): string[] {
  let urlName = latestUrlName;
  const res = [];
  while (urlName !== EARLIEST_URL) {
    res.push(urlName);
    do {
      urlName = getLastUrlName(urlName);
    } while (EXCLUDED_URLS.includes(urlName));
  }
  res.push(EARLIEST_URL);
  return res;
}

/**
 * Return the "closest" urlName to the one provided, as well as whether or not
 * the user should be shown a warning that this does not match the term
 * requested.
 */
export function getClosestUrlName(
  urlName: string | null,
  latestUrlName: string,
): {
  urlName: string;
  shouldWarn: boolean;
} {
  if (urlName === null || urlName === "" || urlName === "latest") {
    return { urlName: latestUrlName, shouldWarn: false };
  }

  const urlNames = getUrlNames(latestUrlName);
  if (urlNames.includes(urlName)) {
    return { urlName: urlName, shouldWarn: false };
  }

  // IAP or summer for a year where those were folded into spring/fall
  if (EXCLUDED_URLS.includes(urlName)) {
    const nextUrlName = getNextUrlName(urlName);
    if (urlNames.includes(nextUrlName)) {
      // modified: false because in these cases, e.g. s24 includes the data
      // corresponding to i24
      return { urlName: nextUrlName, shouldWarn: false };
    }
  }

  const urlNamesSameSem = urlNames.filter((u) => u.startsWith(urlName[0]));
  if (urlNamesSameSem.length > 0) {
    // Unrecognized term, but we can return the latest term of the same type of
    // semester (fall, spring, etc.)
    return { urlName: urlNamesSameSem[0], shouldWarn: true };
  }

  // Fallback: return latest term
  return { urlName: latestUrlName, shouldWarn: true };
}

/** Type of object passed to Term constructor. */
export interface TermInfo {
  urlName: string;
  startDate: string;
  h1EndDate?: string;
  h2StartDate?: string;
  endDate: string;
  mondayScheduleDate?: string | null;
  holidayDates?: string[];
}

/**
 * Type of object parsed from latestTerm.json, including information about the
 * current semester term (fall or spring) and the associated pre-semester term
 * (summer or IAP).
 */
export interface LatestTermInfo {
  preSemester: TermInfo;
  semester: Required<TermInfo>;
}

/**
 * A term object, containing all information about non-class, term-specific
 * information.
 */
export class Term {
  /** Term real year as a two-digit string, e.g. "22" */
  public year: string;
  /** Semester as a character, e.g. "f" */
  public semester: TSemester;
  /** First day of classes, inclusive. */
  public start: Date;
  /** Last day of H1 classes, inclusive. */
  public h1End: Date;
  /** First day of H2 classes, inclusive. */
  public h2Start: Date;
  /** Last day of classes, inclusive. */
  public end: Date;
  /** A Tuesday which runs on Monday schedule, if it exists. */
  public mondaySchedule?: Date;
  /** A list of dates with no class. */
  public holidays: Date[];

  constructor({
    urlName,
    startDate = "",
    h1EndDate = "",
    h2StartDate = "",
    endDate = "",
    mondayScheduleDate,
    holidayDates = [],
  }: Partial<TermInfo> & { urlName: string }) {
    const midnight = (date: string) => new Date(`${date}T00:00:00`);
    const { year, semester } = parseUrlName(urlName);
    this.year = year;
    this.semester = semester;
    this.start = midnight(startDate);
    this.h1End = midnight(h1EndDate);
    this.h2Start = midnight(h2StartDate);
    this.end = midnight(endDate);
    this.mondaySchedule = mondayScheduleDate
      ? midnight(mondayScheduleDate)
      : undefined;
    this.holidays = holidayDates.map((date) => midnight(date));
  }

  /** e.g. "2022" */
  get fullRealYear(): string {
    return `20${this.year}`;
  }

  /** e.g. "fall" */
  get semesterFull(): string {
    return SEMESTER_NAMES[this.semester].full;
  }

  /** e.g. "Fall" */
  get semesterFullCaps(): string {
    return SEMESTER_NAMES[this.semester].fullCaps;
  }

  /** e.g. "Fall 2022" */
  get niceName() {
    return `${this.semesterFullCaps} ${this.fullRealYear}`;
  }

  /** e.g. "f22" */
  get urlName() {
    return `${this.semester}${this.year}`;
  }

  /** e.g. "f22" */
  toString(): string {
    return this.urlName;
  }

  /** The date a slot starts on. */
  startDateFor(
    slot: Slot,
    secondHalf = false,
    startDay?: [number, number],
  ): Date {
    const date = new Date((secondHalf ? this.h2Start : this.start).getTime());

    if (startDay !== undefined) {
      date.setMonth(startDay[0] - 1);
      date.setDate(startDay[1]);
    }

    while (date.getDay() !== slot.weekday) {
      date.setDate(date.getDate() + 1);
    }
    return slot.onDate(date);
  }

  /** The date a slot ends on, plus an extra day. */
  endDateFor(slot: Slot, firstHalf = false, endDay?: [number, number]): Date {
    const date = new Date((firstHalf ? this.h1End : this.end).getTime());

    if (endDay !== undefined) {
      date.setMonth(endDay[0] - 1);
      date.setDate(endDay[1]);
    }

    while (date.getDay() !== slot.weekday) {
      date.setDate(date.getDate() - 1);
    }
    // plus an extra day, for inclusivity issues
    date.setDate(date.getDate() + 1);
    return slot.onDate(date);
  }

  /** Dates that a given slot *doesn't* run on. */
  exDatesFor(slot: Slot): Date[] {
    const res = this.holidays.filter((date) => date.getDay() === slot.weekday);
    const resDates = res.map((date) => slot.onDate(date));

    // remove the tuesday for monday schedule
    if (slot.weekday === 2 && this.mondaySchedule) {
      resDates.push(slot.onDate(this.mondaySchedule));
    }

    return resDates;
  }

  /** An extra date a given slot would fall on, if it exists. */
  rDateFor(slot: Slot): Date | undefined {
    return slot.weekday === 1 && this.mondaySchedule
      ? slot.onDate(this.mondaySchedule)
      : undefined;
  }
}
