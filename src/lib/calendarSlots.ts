import type { NonClass, Timeslot } from "./activity";
import type { Section, Sections, Class } from "./class";

/**
 * Helper function for selectSlots. Implements backtracking: we try to place
 * freeSections while counting the number of conflicts, returning all options
 * with the minimum number of conflicts.
 *
 * @param freeSections - Remaining sections to schedule
 * @param filledSlots - Timeslots that have been scheduled
 * @param foundOptions - Option currently being built
 * @param curConflicts - Current number of conflicts of foundOptions
 * @param foundMinConflicts - Best number of conflicts so far
 * @returns Object with best options found so far and number of conflicts
 */
function selectHelper(
  freeSections: Sections[],
  filledSlots: Timeslot[],
  foundOptions: Section[],
  curConflicts: number,
  foundMinConflicts: number,
): {
  options: Section[][];
  minConflicts: number;
} {
  if (freeSections.length === 0) {
    return { options: [foundOptions], minConflicts: curConflicts };
  }

  let options: Section[][] = [];
  let minConflicts: number = foundMinConflicts;

  const [secs, ...remainingSections] = freeSections;

  for (const sec of secs.sections) {
    const newConflicts = sec.countConflicts(filledSlots);
    if (curConflicts + newConflicts > minConflicts) continue;

    const { options: newOptions, minConflicts: newMinConflicts } = selectHelper(
      remainingSections,
      filledSlots.concat(sec.timeslots),
      foundOptions.concat(sec),
      curConflicts + newConflicts,
      minConflicts,
    );

    if (newMinConflicts < minConflicts) {
      options = [];
      minConflicts = newMinConflicts;
    }

    if (newMinConflicts === minConflicts) {
      options.push(...newOptions);
    }
  }

  return { options, minConflicts };
}

/**
 * Find best options for choosing sections among classes. Returns list of list
 * of possible options.
 *
 * @param selectedClasses - Current classes to schedule
 * @returns Object with:
 *    options - list of schedule options; each schedule option is a list of all
 *      sections in that schedule, including locked sections (but not including
 *      non-class activities.)
 *    conflicts - number of conflicts in any option
 */
export function scheduleSlots(
  selectedClasses: Class[],
  selectedNonClasses: NonClass[],
): {
  options: Section[][];
  conflicts: number;
} {
  const lockedSections: Sections[] = [];
  const lockedOptions: Section[] = [];
  const initialSlots: Timeslot[] = [];
  const freeSections: Sections[] = [];

  for (const cls of selectedClasses) {
    for (const secs of cls.sections) {
      if (secs.locked) {
        const sec = secs.selected;
        if (sec) {
          lockedSections.push(secs);
          lockedOptions.push(sec);
          initialSlots.push(...sec.timeslots);
        } else {
          // locked to having no section, do nothing
        }
      } else if (secs.sections.length > 0) {
        freeSections.push(secs);
      }
    }
  }

  for (const activity of selectedNonClasses) {
    initialSlots.push(...activity.timeslots);
  }

  const result = selectHelper(freeSections, initialSlots, [], 0, Infinity);

  return {
    options: result.options,
    conflicts: result.minConflicts,
  };
}
