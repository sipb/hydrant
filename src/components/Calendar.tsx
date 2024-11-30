import { Box, Text } from "@chakra-ui/react";
import FullCalendar from "@fullcalendar/react";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Activity, NonClass, Timeslot } from "../lib/activity";
import { Slot } from "../lib/dates";
import { State } from "../lib/state";

import "./Calendar.scss";
import { useMemo } from "react";

/**
 * Calendar showing all the activities, including the buttons on top that
 * change the schedule option selected.
 */
export function Calendar(props: {
  selectedActivities: Array<Activity>;
  viewedActivity: Activity | undefined;
  state: State;
}) {
  const { selectedActivities, viewedActivity, state } = props;

  const events = useMemo(
    () =>
      selectedActivities
        .flatMap((act) => act.events)
        .flatMap((event) => event.eventInputs),
    [selectedActivities],
  );
  const handleEventClick = (e: EventClickArg) => {
    // extendedProps: non-standard props of {@link Event.eventInputs}
    state.setViewedActivity(e.event.extendedProps.activity as Activity);
  };

  const handleSelect = (e: DateSelectArg) => {
    viewedActivity instanceof NonClass &&
      state.addTimeslot(
        viewedActivity,
        Timeslot.fromStartEnd(
          Slot.fromStartDate(e.start),
          Slot.fromStartDate(e.end),
        ),
      );
  };

  return (
    <FullCalendar
      plugins={[timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      allDaySlot={false}
      dayHeaderFormat={{ weekday: "short" }}
      editable={false}
      events={events}
      eventContent={renderEvent}
      eventClick={handleEventClick}
      displayEventTime={false}
      headerToolbar={false}
      height="auto"
      // a date that is, conveniently enough, a monday
      initialDate="2001-01-01"
      slotDuration="00:30:00"
      slotLabelFormat={({ date }) => {
        const { hour } = date;
        return hour === 12
          ? "noon"
          : hour < 12
            ? `${hour} AM`
            : `${hour - 12} PM`;
      }}
      slotMinTime="08:00:00"
      slotMaxTime="22:00:00"
      weekends={false}
      selectable={viewedActivity instanceof NonClass}
      select={handleSelect}
    />
  );
}

const renderEvent = ({ event }: EventContentArg) => {
  return (
    <Box
      p={0.5}
      lineHeight={1.3}
      cursor="pointer"
      color={event.textColor}
      height="100%"
    >
      <Text
        fontSize="sm"
        fontWeight={500}
        overflow="hidden"
        textOverflow="clip"
        whiteSpace="nowrap"
      >
        {event.title}
      </Text>
      <Text fontSize="xs">{event.extendedProps.room}</Text>
    </Box>
  );
};
