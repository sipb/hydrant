import { useContext, useMemo } from "react";

import { Box, Circle, Float, Text } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

import FullCalendar from "@fullcalendar/react";
import type { EventContentArg, EventApi } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import type { Activity } from "../lib/activity";
import { CustomActivity, Timeslot } from "../lib/activity";
import { Slot } from "../lib/dates";
import { HydrantContext } from "../lib/hydrant";

import "./Calendar.css";

// Threshold at which to display a distance warning, in feet (650 meters)
const DISTANCE_WARNING_THRESHOLD = 2112;

// Walking speed, in ft/s (~3 mph)
const WALKING_SPEED = 4.4;

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

  const getBuildingNumber = (room: string) =>
    room.split("-")[0].trim().replace(/\+$/, "");

  /**
   * Get the approximate distance (in feet) between two buildings on campus
   */
  const getDistance = (building1: string, building2: string) => {
    // Get coordinates of each building
    const location1 = state.locations.get(building1);
    const location2 = state.locations.get(building2);

    if (!location1 || !location2) {
      return undefined;
    }

    const dx = location1.x - location2.x;
    const dy = location1.y - location2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Check if event1 ends at the same time that some other event starts. If
   * this is the case and the commute distance between the two events' locations
   * is more than half a mile, return an appropriate warning message. Otherwise,
   * return undefined.
   */
  const getDistanceWarning = (thisEvent: EventApi) => {
    const thisRoom = thisEvent.extendedProps.room as string | undefined;
    if (!thisEvent.start || !thisRoom) {
      return undefined;
    }

    for (const beforeEvent of events) {
      if (!beforeEvent.start || !beforeEvent.room) {
        continue;
      }
      if (thisEvent.start.getTime() != beforeEvent.end.getTime()) {
        continue;
      }

      const thisBuilding = getBuildingNumber(thisRoom);
      const beforeBuilding = getBuildingNumber(beforeEvent.room);

      // Approximate distance (in feet) between the two buildings
      const distance = getDistance(thisBuilding, beforeBuilding);

      if (distance === undefined || distance < DISTANCE_WARNING_THRESHOLD) {
        continue;
      }

      const formattedDistance = state.measurementSystem.formatLength(distance);
      const mins = (distance / WALKING_SPEED / 60).toFixed(0);

      return (
        <Text>
          Warning: distance from {beforeBuilding} to {thisBuilding} is{" "}
          {formattedDistance}
          <br />
          (about a {mins}-minute walk)
        </Text>
      );
    }
    return undefined;
  };

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
    const activity = event.extendedProps.activity as Activity;
    const distanceWarning = getDistanceWarning(event);

    return (
      <>
        <Box
          color={event.textColor}
          overflow="hidden"
          p={0.5}
          lineHeight={1.3}
          cursor="pointer"
          height="100%"
          position="relative"
        >
          {!(activity instanceof CustomActivity) ? (
            <Tooltip
              content={activity.name}
              portalled
              positioning={{ placement: "top" }}
            >
              {TitleText()}
            </Tooltip>
          ) : (
            <TitleText />
          )}
          {event.extendedProps.roomClarification ? (
            <Tooltip
              content={event.extendedProps.roomClarification as string}
              portalled
              positioning={{ placement: "top" }}
            >
              <Text fontSize="xs">{room}</Text>
            </Tooltip>
          ) : (
            <Text fontSize="xs">{room}</Text>
          )}
        </Box>
        {distanceWarning ? (
          <Float placement="top-end">
            <Tooltip
              content={distanceWarning}
              portalled
              positioning={{ placement: "top" }}
            >
              <Circle
                size="5"
                bg="orange.solid"
                color="orange.contrast"
                boxShadow="lg"
              >
                !
              </Circle>
            </Tooltip>
          </Float>
        ) : null}
      </>
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
      slotLabelInterval={"01:00"}
      nowIndicator={true}
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
