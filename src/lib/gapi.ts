import { useGoogleLogin } from "@react-oauth/google";
import { EventAttributes, DateArray, createEvents } from "ics";

import { Activity } from "./activity";
import { CALENDAR_COLOR } from "./colors";
import { Term } from "./dates";
import { State } from "./state";

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

/** Returns a date as a UTC date array */
function toDateArray(date: Date): DateArray {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

/** Downloads a file with the given text data */
function download(filename: string, text: string) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

/** Returns a date as an RRULE string without a timezone. */
function toRRuleString(date: Date): string {
  return Array.from(toISOString(date))
    .filter((char) => char !== "-" && char !== ":")
    .join("");
}

/** Return a list of events for an activity that happen on a given term. */
function toGoogleCalendarEvents(
  activity: Activity,
  term: Term
): Array<gapi.client.calendar.Event> {
  return activity.events.flatMap((event) =>
    event.slots.map((slot) => {
      const startDate = term.startDateFor(slot.startSlot);
      const startDateEnd = term.startDateFor(slot.endSlot);
      const endDate = term.endDateFor(slot.startSlot);
      const exDates = term.exDatesFor(slot.startSlot);
      const rDate = term.rDateFor(slot.startSlot);
      return {
        summary: event.name,
        location: event.room,
        start: { dateTime: toISOString(startDate), timeZone: TIMEZONE },
        end: { dateTime: toISOString(startDateEnd), timeZone: TIMEZONE },
        recurrence: [
          // for some reason, gcal wants UNTIL to be a date, not time
          `RRULE:FREQ=WEEKLY;UNTIL=${toRRuleString(endDate).split("T")[0]}`,
          `EXDATE;TZID=${TIMEZONE}:${exDates.map(toRRuleString).join(",")}`,
          rDate && `RDATE;TZID=${TIMEZONE}:${toRRuleString(rDate)}`,
        ].filter((t): t is string => t !== undefined),
      };
    })
  );
}

function toICSEvents(activity: Activity, term: Term): Array<EventAttributes> {
  return activity.events.flatMap((event) =>
    event.slots.map((slot) => {
      const startDate = term.startDateFor(slot.startSlot);
      const startDateEnd = term.startDateFor(slot.endSlot);
      const endDate = term.endDateFor(slot.startSlot);
      const exDates = term.exDatesFor(slot.startSlot);
      const rDate = term.rDateFor(slot.startSlot);
      console.log(event.name, startDate);
      return {
        title: event.name,
        location: event.room,
        start: toDateArray(startDate),
        startInputType: "utc",
        end: toDateArray(startDateEnd),
        endInputType: "utc",
        recurrenceRule: [
          // for some reason, gcal wants UNTIL to be a date, not time
          `FREQ=WEEKLY;UNTIL=${toRRuleString(endDate).split("T")[0]}`,
          `EXDATE;TZID=${TIMEZONE}:${exDates.map(toRRuleString).join(",")}`,
          rDate && `RDATE;TZID=${TIMEZONE}:${toRRuleString(rDate)}`,
        ].filter((t): t is string => t !== undefined)[0],
      };
    })
  );
}

/** Hook that returns an export calendar function. */
export function useGoogleCalendarExport(
  state: State,
  onSuccess?: () => void,
  onError?: () => void
): () => void {
  /** Insert a new calendar for this semester. */
  const insertCalendar = async (): Promise<string> => {
    const calendarName = `Hydrant: ${state.term.niceName}`;
    const resp = await gapi.client.calendar.calendars.insert(
      {},
      { summary: calendarName }
    );
    return resp.result.id!;
  };

  /** Set the background of the calendar to the State color. */
  const setCalendarBackground = async (calendarId: string) => {
    const resp = await gapi.client.calendar.calendarList.get({ calendarId });
    const calendar = resp.result;
    calendar.backgroundColor = CALENDAR_COLOR;
    await gapi.client.calendar.calendarList.update({
      calendarId: calendar.id!,
      colorRgbFormat: true,
      resource: calendar,
    });
  };

  /** Add the classes / non-classes to the calendar. */
  const addCalendarEvents = async (calendarId: string) => {
    const batch = gapi.client.newBatch();
    state.selectedActivities
      .flatMap((activity) => toGoogleCalendarEvents(activity, state.term))
      .forEach((resource) =>
        batch.add(
          gapi.client.calendar.events.insert({
            calendarId,
            resource,
          })
        )
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
      if (tokenResponse?.access_token) {
        gapi.client.setApiKey(process.env.REACT_APP_API_KEY!);
        gapi.client.load("calendar", "v3", exportCalendar);
      }
    },
    onError,
  });

  return onCalendarExport;
}

export function useICSExport(
  state: State,
  onSuccess?: () => void,
  onError?: () => void
): () => void {
  return async () => {
    const events = state.selectedActivities.flatMap((activity) =>
      toICSEvents(activity, state.term)
    );
    const calendarName = `Hydrant: ${state.term.niceName}`;
    events.forEach((event) => {
      event.calName = calendarName;
    });
    console.log(events);
    createEvents(events, (error, value) => {
      if (error) onError?.();
      download(`${state.term.urlName}.ics`, value);
      onSuccess?.();
    });
  };
}
