import { useContext, useMemo } from "react";

import { Box, Text } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import FullCalendar from "@fullcalendar/react";
import type { EventContentArg } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import type { Activity } from "../lib/activity";
import { NonClass, Timeslot } from "../lib/activity";
import { Slot } from "../lib/dates";
import { Class } from "../lib/class";
import { HydrantContext } from "../lib/hydrant";

import "./Calendar.scss";

/**
 * Calendar showing all the activities, including the buttons on top that
 * change the schedule option selected.
 */
export function Calendar() {
  const { state, hydrantState } = useContext(HydrantContext);
  const { selectedActivities, viewedActivity } = hydrantState;

  const renderEvent = ({ event }: EventContentArg) => {
    const TitleText = () => (
      <Text
        fontSize="sm"
        fontWeight="medium"
        overflow="hidden"
        textOverflow="clip"
        whiteSpace="nowrap"
      >
        {event.title}
      </Text>
    );

    return (
      <Box
        color={event.textColor}
        p={0.5}
        lineHeight={1.3}
        cursor="pointer"
        height="100%"
      >
        {event.extendedProps.activity instanceof Class ? (
          <Tooltip
            content={event.extendedProps.activity.name}
            portalled
            positioning={{ placement: "top" }}
            children={TitleText()}
          />
        ) : (
          <TitleText />
        )}
        <Text fontSize="xs">{event.extendedProps.room}</Text>
      </Box>
    );
  };

  const events = useMemo(() => {
    return selectedActivities
      .flatMap((act) => act.events)
      .flatMap((event) => event.eventInputs);
  }, [selectedActivities]);

  return (
    <FullCalendar
      plugins={[timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      allDaySlot={false}
      dayHeaderFormat={{ weekday: "short" }}
      editable={false}
      events={events}
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
            ? `${hour.toString()} AM`
            : `${(hour - 12).toString()} PM`;
      }}
      slotMinTime={
        events.some((e) => (e.start as Date).getHours() < 8)
          ? "06:00:00"
          : "08:00:00"
      }
      slotMaxTime="22:00:00"
      weekends={false}
      selectable={viewedActivity instanceof NonClass}
      select={(e) => {
        if (viewedActivity instanceof NonClass) {
          state.addTimeslot(
            viewedActivity,
            Timeslot.fromStartEnd(
              Slot.fromStartDate(e.start),
              Slot.fromStartDate(e.end),
            ),
          );
        }
      }}
    />
  );
}
