import { type DeflatedClass, parseDeflatedClass } from "./activity";
import type { DeflatedSave } from "./schema";
import type { Class } from "./class";
import type { Term } from "./dates";
import { SectionKind } from "./raw";
import type { ScheduleContents } from "./auth";
import { UAParser } from "ua-parser-js";

import "temporal-polyfill/global";

/** Fireroad limits file names to 50 characters. */
const MAX_REMOTE_NAME_LENGTH = 50;

const FIREROAD_SECTION_KINDS = {
  [SectionKind.LECTURE]: "Lecture",
  [SectionKind.RECITATION]: "Recitation",
  [SectionKind.LAB]: "Lab",
  [SectionKind.DESIGN]: "Design",
} as const;

/**
 * Convert a deflated save into Fireroad's schedule format, keeping the full
 * Hydrant state so custom activities, PE classes, colors, etc. survive.
 */
export function toScheduleContents(
  state: DeflatedSave,
  term: string,
  name: string,
  classes: Map<string, Class>,
): ScheduleContents {
  const selectedSubjects = state[0].flatMap((deflated) => {
    const number = typeof deflated === "string" ? deflated : deflated[0];
    const cls = classes.get(number);
    if (!cls) return [];

    const locked = parseDeflatedClass(deflated).sections;
    const allowedSections: ScheduleContents["selectedSubjects"][number]["allowedSections"] =
      {};
    const selectedSections: ScheduleContents["selectedSubjects"][number]["selectedSections"] =
      {};
    cls.sections.forEach((secs, i) => {
      const index = locked[i];
      if (typeof index !== "number") return;
      const kind = FIREROAD_SECTION_KINDS[secs.kind];
      allowedSections[kind] = [index];
      selectedSections[kind] = index;
    });

    return [
      {
        subject_id: cls.number,
        title: cls.name,
        units: cls.totalUnits,
        allowedSections,
        selectedSections,
      },
    ];
  });

  return { selectedSubjects, hydrant: { term, name, state } };
}

/**
 * Convert Fireroad's schedule format back into a deflated save. Schedules
 * last written by another client only keep their subjects and locked sections.
 */
export function fromScheduleContents(
  contents: ScheduleContents,
  classes: Map<string, Class>,
): DeflatedSave {
  if (contents.hydrant?.state) return contents.hydrant.state;

  const deflatedClasses = contents.selectedSubjects.flatMap<DeflatedClass>(
    (subject) => {
      const cls = classes.get(subject.subject_id);
      if (!cls) return [subject.subject_id];

      const sections = cls.sections.map((secs) => {
        const allowed =
          subject.allowedSections?.[FIREROAD_SECTION_KINDS[secs.kind]];
        return allowed?.length === 1 ? allowed[0] : null;
      });
      while (sections.at(-1) === null) sections.pop();
      return [[cls.number, ...sections]];
    },
  );

  return [deflatedClasses, null, 0, []];
}

/** Whether a deflated save has nothing in it. */
export function isEmptyState(state: unknown[] | null): boolean {
  if (!state) return true;
  const [classes, customActivities, , peClasses] = state as (
    unknown[] | null | undefined
  )[];
  return !classes?.length && !customActivities?.length && !peClasses?.length;
}

/** End of a Hydrant save's Fireroad name, e.g. " (Fall 2026)". */
export function termSuffix(term: Term): string {
  return ` (${term.niceName})`;
}

/**
 * Name of the save on Fireroad. Fireroad names are unique across all of a
 * user's schedules, so include the term.
 */
export function remoteName(name: string, term: Term): string {
  const suffix = termSuffix(term);
  return name.slice(0, MAX_REMOTE_NAME_LENGTH - suffix.length) + suffix;
}

/** Current time as an ISO string, to the millisecond. */
export function isoNow(): string {
  return Temporal.Now.instant().toString({ smallestUnit: "millisecond" });
}

/**
 * The later of two ISO times. Fireroad rejects changes dated before the last
 * download, which can happen if the local clock is behind the server.
 */
export function notBefore(time: string, earliest?: string): string {
  if (
    earliest &&
    Temporal.Instant.compare(
      Temporal.Instant.from(time),
      Temporal.Instant.from(earliest),
    ) < 0
  ) {
    return earliest;
  }
  return time;
}

/** Readable name for a browser, e.g. "Hydrant on Firefox (macOS)". */
export function deviceName(userAgent: string): string {
  const { browser, os } = UAParser(userAgent);

  if (!browser.name) return os.name ? `Hydrant on ${os.name}` : "Hydrant";
  return `Hydrant on ${browser.name}${os.name ? ` (${os.name})` : ""}`;
}

/**
 * Fireroad only reports conflicts between different agents, so the agent ends
 * with an id to tell apart e.g. two copies of Firefox on macOS.
 */
export function agentName(userAgent: string, id: string): string {
  return `${deviceName(userAgent)} #${id}`;
}

/** Agent without its id, for showing to users. Undefined if unknown. */
export function displayAgent(agent: string): string | undefined {
  // Fireroad stores "Anonymous" when a client sends no agent
  if (!agent || agent === "Anonymous") return undefined;
  return agent.replace(/ #\w+$/, "");
}
