import type { ICalEventData } from "ical-generator";
import { ICalCalendar } from "ical-generator";
import { RRule, RRuleSet } from "rrule";
import { tzlib_get_ical_block } from "timezones-ical-library";

import type { Activity } from "./activity";
import type { Term } from "./dates";
import type { State } from "./state";

/** Timezone string. */
const TIMEZONE = "America/New_York";

/** Downloads a file with the given text data */
function download(filename: string, text: string) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function toICalEvents(activity: Activity, term: Term): ICalEventData[] {
  return activity.events.flatMap((event) =>
    event.slots.map((slot) => {
      const rawClass =
        "rawClass" in event.activity ? event.activity.rawClass : undefined;

      const start = rawClass?.quarterInfo?.start;
      const end = rawClass?.quarterInfo?.end;
      const h1 = rawClass?.half === 1;
      const h2 = rawClass?.half === 2;

      const startDate = term.startDateFor(slot.startSlot, h2, start);
      const startDateEnd = term.startDateFor(slot.endSlot, h2, start);
      const endDate = term.endDateFor(slot.startSlot, h1, end);
      const exDates = term.exDatesFor(slot.startSlot);
      const rDate = term.rDateFor(slot.startSlot);

      const rrule = new RRule({
        freq: RRule.WEEKLY,
        until: endDate,
      });

      const rruleSet = new RRuleSet();
      rruleSet.rrule(rrule);

      for (const exdate of exDates) {
        rruleSet.exdate(exdate);
      }

      if (rDate) {
        rruleSet.rdate(rDate);
      }

      return {
        summary: event.name,
        location: event.room,
        start: startDate,
        end: startDateEnd,
        timezone: TIMEZONE,
        repeating: rruleSet,
      } satisfies ICalEventData;
    }),
  );
}

/** Hook that returns an export calendar function. */
export function useICSExport(
  state: State | undefined,
  onSuccess?: () => void,
  onError?: () => void,
): () => void {
  return () => {
    const cal = new ICalCalendar({
      name: `Hydrant: ${state?.term.niceName ?? ""}`,
      timezone: {
        name: TIMEZONE,
        generator: (zone) => tzlib_get_ical_block(zone)[0],
      },
      events: state?.selectedActivities.flatMap((activity) =>
        toICalEvents(activity, state.term),
      ),
    });
    console.log(cal);

    try {
      download(`${state?.term.urlName ?? ""}.ics`, cal.toString());
    } catch (_err) {
      onError?.();
    }
    onSuccess?.();
  };
}
