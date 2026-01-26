import { useContext, useMemo } from "react";

import { Box, Circle, Float, Text } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import FullCalendar from "@fullcalendar/react";
import type { EventContentArg, EventApi } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import geodesic from "geographiclib-geodesic";
const geod = geodesic.Geodesic.WGS84;

import type { BaseActivity, Activity } from "../lib/activity";
import { CustomActivity, Timeslot } from "../lib/activity";
import { Slot } from "../lib/dates";
import { Class } from "../lib/class";
import { HydrantContext } from "../lib/hydrant";

import "./Calendar.css";

/**
 * Calendar showing all the activities, including the buttons on top that
 * change the schedule option selected.
 */
export function Calendar() {
  const { state, hydrantState } = useContext(HydrantContext);
  const { selectedActivities, viewedActivity } = hydrantState;

  const events = useMemo(() => {
    return selectedActivities
      .flatMap((act) => act.events)
      .flatMap((event) => event.eventInputs);
  }, [selectedActivities]);

  /**
   * Check if event1 ends at the same time that some other event starts. If
   * this is the case and the commute distance between the two events' locations
   * is more than 500 metres, return an appropriate warning message. Otherwise,
   * return undefined.
   */
  const getDistanceWarning = (event1: EventApi) => {
    const room1 = event1.extendedProps.room as string | undefined;
    if (!event1.end || !room1) {
      return undefined;
    }

    for (const event2 of events) {
      if (!event2.start || !event2.room) {
        continue;
      }
      if (event1.end.getTime() != event2.start.getTime()) {
        continue;
      }

      // Extract building numbers from room numbers
      const building1 = room1.split("-")[0].trim();
      const building2 = event2.room.split("-")[0].trim();

      // Get coordinates of each building
      const location1 = state.locations.get(building1);
      const location2 = state.locations.get(building2);

      if (!location1 || !location2) {
        continue;
      }

      // Approximate distance (in metres) between the two buildings
      const distance = geod.Inverse(
        location1.lat,
        location1.long,
        location2.lat,
        location2.long,
      ).s12;

      if (distance === undefined || distance < 500) {
        continue;
      }

      const formattedDistance =
        distance < 1000
          ? `${distance.toFixed(0)} m`
          : `${(distance / 1000).toFixed(2)} km`;

      return `Warning: distance from ${building1} to ${building2} is ${formattedDistance}`;
    }
    return undefined;
  }

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

    const room = event.extendedProps.room as string | undefined;
    const activity = event.extendedProps.activity as BaseActivity;
    const distanceWarning = getDistanceWarning(event);

    return (
      <Box
        color={event.textColor}
        p={0.5}
        lineHeight={1.3}
        cursor="pointer"
        height="100%"
        position="relative"
      >
        {activity instanceof Class ? (
          <Tooltip
            content={activity.name}
            portalled
            positioning={{ placement: "top" }}
            children={TitleText()}
          />
        ) : (
          <TitleText />
        )}
        <Text fontSize="xs">{room}</Text>
        {distanceWarning ? (
        <Float placement="bottom-end">
          <Tooltip
            content={distanceWarning}
            portalled
            positioning={{ placement: "top" }}
          >
            <Circle size="5" bg="fg.warning" color="white" boxShadow="lg">
              !
            </Circle>
          </Tooltip>
        </Float>
        ) : null
        }
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
      selectable={viewedActivity instanceof CustomActivity}
      select={(e) => {
        if (viewedActivity instanceof CustomActivity) {
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
