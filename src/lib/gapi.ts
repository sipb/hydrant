import { useGoogleLogin } from "@react-oauth/google";
import type { ICalEventData } from "ical-generator";
import { ICalCalendar } from "ical-generator";
import { RRule, RRuleSet } from "rrule";
import { tzlib_get_ical_block } from "timezones-ical-library";

import type { Activity } from "./activity";
import { CALENDAR_COLOR } from "./colors";
import type { Term } from "./dates";
import type { State } from "./state";

/** Timezone string. */
const TIMEZONE = "America/New_York";

/** Returns a date as an ISO string without a timezone. */
function toISOString(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

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

/** Return a list of events for an activity that happen on a given term. */
function toGoogleCalendarEvents(
  activity: Activity,
  term: Term,
): gapi.client.calendar.Event[] {
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
        start: { dateTime: toISOString(startDate), timeZone: TIMEZONE },
        end: { dateTime: toISOString(startDateEnd), timeZone: TIMEZONE },
        recurrence: rruleSet.valueOf(),
      } satisfies gapi.client.calendar.Event;
    }),
  );
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
export function useGoogleCalendarExport(
  state: State,
  onSuccess?: () => void,
  onError?: () => void,
): () => void {
  /** Insert a new calendar for this semester. */
  const insertCalendar = async (): Promise<string> => {
    const calendarName = `Hydrant: ${state.term.niceName}`;
    const resp = await gapi.client.calendar.calendars.insert(
      {},
      { summary: calendarName },
    );
    return resp.result.id ?? "";
  };

  /** Set the background of the calendar to the State color. */
  const setCalendarBackground = async (calendarId: string) => {
    const resp = await gapi.client.calendar.calendarList.get({ calendarId });
    const calendar = resp.result;
    calendar.backgroundColor = CALENDAR_COLOR;
    await gapi.client.calendar.calendarList.update({
      calendarId: calendar.id ?? "",
      colorRgbFormat: true,
      resource: calendar,
    });
  };

  /** Add the classes / non-classes to the calendar. */
  const addCalendarEvents = async (calendarId: string) => {
    const batch = gapi.client.newBatch();
    state.selectedActivities
      .flatMap((activity) => toGoogleCalendarEvents(activity, state.term))
      .forEach((resource) => {
        batch.add(
          gapi.client.calendar.events.insert({
            calendarId,
            resource,
          }),
        );
      },
      );
    await batch.then();
  };

  /** Create a new calendar and populate it. */
  const exportCalendar = async () => {
    const calendarId = await insertCalendar();
    await setCalendarBackground(calendarId);
    await addCalendarEvents(calendarId);
    onSuccess?.();
    window.open("https://calendar.google.com", "_blank");
  };

  /** Request permission and create calendar. */
  const onCalendarExport = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar",
    onSuccess: (tokenResponse) => {
      if (tokenResponse.access_token) {
        gapi.client.setApiKey(import.meta.env.VITE_GOOGLE_CLIENT_ID);
        gapi.client
          .load('https://calendar-json.googleapis.com/$discovery/rest?version=v3')
          .then(() => exportCalendar)
          .catch((err: unknown) => {
            console.error("Error loading Google Calendar API", err);
          });
      }
    },
    onError,
  });

  return onCalendarExport;
}

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
