import { Box, Text } from "@chakra-ui/react";
import FullCalendar from "@fullcalendar/react";
import type { EventContentArg } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Activity, NonClass, Timeslot } from "../lib/activity";
import { Slot } from "../lib/dates";
import { State } from "../lib/state";

import "./Calendar.scss";

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

  const renderEvent = ({ event }: EventContentArg) => {
    return (
      <Box
        color={event.textColor}
        p={0.5}
        lineHeight={1.3}
        cursor="pointer"
        height="100%"
      >
        <Text
          fontSize="sm"
          fontWeight="medium"
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

  return (
    <FullCalendar
      plugins={[timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      allDaySlot={false}
      dayHeaderFormat={{ weekday: "short" }}
      editable={false}
      events={selectedActivities
        .flatMap((act) => act.events)
        .flatMap((event) => event.eventInputs)}
      eventContent={renderEvent}
      eventClick={(e) => {
        // extendedProps: non-standard props of {@link Event.eventInputs}
        state.setViewedActivity(e.event.extendedProps.activity as Activity);
      }}
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
      select={(e) =>
        viewedActivity instanceof NonClass &&
        state.addTimeslot(
          viewedActivity,
          Timeslot.fromStartEnd(
            Slot.fromStartDate(e.start),
            Slot.fromStartDate(e.end),
          ),
        )
      }
    />
  );
}
