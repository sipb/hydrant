import { useMemo } from "react";

import {
  Box,
  Circle,
  Flex,
  Float,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import FullCalendar, {
  type EventDisplayInfo,
  type EventApi,
} from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/react/interaction";
import themePlugin from "@fullcalendar/react/themes/monarch";
import timeGridPlugin from "@fullcalendar/react/timegrid";

import { CustomActivity, isActivity, Timeslot } from "../lib/activity";
import { Slot } from "../lib/dates";
import { useHydrantContext } from "../lib/hydrant";
import { ScheduleOption } from "./ScheduleOption";
import { Tooltip } from "./ui/tooltip";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import styles from "./Calendar.module.css";

// Threshold at which to display a distance warning, in feet (650 meters)
const DISTANCE_WARNING_THRESHOLD = 2112;

// Walking speed, in ft/s (~3 mph)
const WALKING_SPEED = 4.4;

// User's timezone (for converting between Date and Temporal.PlainDateTime)
const USER_TZ = Temporal.Now.timeZoneId();

/**
 * get building number from a room string
 */
const getBuildingNumber = (room: string) =>
  room.split("-")[0].trim().replace(/\+$/, "");

/**
 * Get the approximate distance of two coordinates
 */
const getDistance = (
  location1: { x: number; y: number },
  location2: { x: number; y: number },
) => {
  const dx = location1.x - location2.x;
  const dy = location1.y - location2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const TitleText = (props: {
  smallText: boolean;
  titleClass: string;
  title: string;
}) => {
  const { smallText, titleClass, title } = props;
  return (
    <Text
      fontSize={smallText ? "xs" : "sm"}
      fontWeight="medium"
      className={titleClass}
    >
      {title}
    </Text>
  );
};

const RoomText = (props: {
  smallText: boolean;
  timeClass: string;
  room?: string;
}) => {
  const { smallText, timeClass, room } = props;
  return (
    <Text fontSize={smallText ? "2xs" : "xs"} className={timeClass}>
      {room}
    </Text>
  );
};

/**
 * Calendar showing all the activities, including the buttons on top that
 * change the schedule option selected.
 */
export function Calendar() {
  const { state, hydrantState } = useHydrantContext();
  const { selectedActivities, viewedActivity } = hydrantState;

  const events = useMemo(() => {
    return selectedActivities
      .flatMap((act) => act.events)
      .flatMap((event) => event.eventInputs);
  }, [selectedActivities]);

  /**
   * Get the approximate distance (in feet) between two buildings on campus
   */
  const getBuildingDistance = (building1: string, building2: string) => {
    const location1 = state.locations.get(building1);
    const location2 = state.locations.get(building2);

    if (!location1 || !location2) {
      return undefined;
    }

    return getDistance(location1, location2);
  };

  /**
   * If another event ends exactly when this one starts and the two buildings
   * are at least DISTANCE_WARNING_THRESHOLD apart, describe that walk.
   */
  const findDistanceWarning = (
    start: Temporal.PlainDateTime,
    thisRoom: string,
  ) => {
    for (const beforeEvent of events) {
      if (!beforeEvent.end || !beforeEvent.room) {
        continue;
      }
      if (
        Temporal.PlainDateTime.compare(
          start,
          Temporal.PlainDateTime.from(beforeEvent.end),
        ) !== 0
      ) {
        continue;
      }

      const thisBuilding = getBuildingNumber(thisRoom);
      const beforeBuilding = getBuildingNumber(beforeEvent.room);
      const distance = getBuildingDistance(thisBuilding, beforeBuilding);

      if (distance === undefined || distance < DISTANCE_WARNING_THRESHOLD) {
        continue;
      }

      return {
        from: beforeBuilding,
        to: thisBuilding,
        distance: state.measurementSystem.formatLength(distance),
        mins: (distance / WALKING_SPEED / 60).toFixed(0),
      };
    }
    return undefined;
  };

  const getDistanceWarning = (thisEvent: EventApi) => {
    const thisRoom: unknown = thisEvent.extendedProps.room;
    if (!thisEvent.start || typeof thisRoom !== "string" || !thisRoom) {
      return undefined;
    }
    const warning = findDistanceWarning(
      thisEvent.start
        .toTemporalInstant()
        .toZonedDateTimeISO(USER_TZ)
        .toPlainDateTime(),
      thisRoom,
    );
    if (!warning) {
      return undefined;
    }
    return (
      <Text>
        Warning: distance from {warning.from} to {warning.to} is{" "}
        {warning.distance}
        <br />
        (about a {warning.mins}-minute walk)
      </Text>
    );
  };

  const renderEvent = ({
    event,
    titleClass,
    timeClass,
    isNarrow,
    isShort,
  }: EventDisplayInfo) => {
    // ensure event is activity
    if (!isActivity(event.extendedProps.activity)) {
      return null;
    }

    const room = event.extendedProps.room;
    const activity = event.extendedProps.activity;
    const distanceWarning = getDistanceWarning(event);
    const smallText = isNarrow || isShort;

    // ensure room is either string or undefined
    if (typeof room !== "string" && room !== undefined) {
      return null;
    }

    room satisfies string | undefined;

    return (
      <>
        {!(activity instanceof CustomActivity) ? (
          <Tooltip
            content={activity.name}
            portalled
            positioning={{ placement: "top" }}
          >
            {TitleText({
              smallText,
              titleClass,
              title: event.title,
            })}
          </Tooltip>
        ) : (
          <TitleText
            smallText={smallText}
            titleClass={titleClass}
            title={event.title}
          />
        )}
        {event.extendedProps.roomClarification ? (
          <Tooltip
            content={event.extendedProps.roomClarification}
            portalled
            positioning={{ placement: "top" }}
          >
            {RoomText({ smallText, timeClass, room })}
          </Tooltip>
        ) : (
          <RoomText smallText={smallText} timeClass={timeClass} room={room} />
        )}
        {distanceWarning ? (
          <Float placement="top-end" offsetX={1.5} offsetY={-0.5}>
            <Tooltip
              content={distanceWarning}
              portalled
              positioning={{ placement: "top" }}
            >
              <Circle
                size="5"
                bg="orange.700"
                color="white"
                boxShadow="lg"
                cursor={"initial"}
                tabIndex={0}
                _print={{ boxShadow: "none" }}
              >
                <span aria-hidden="true">!</span>
                <VisuallyHidden>Long walk before this class</VisuallyHidden>
              </Circle>
            </Tooltip>
          </Float>
        ) : null}
      </>
    );
  };

  return (
    <FullCalendar
      plugins={[themePlugin, timeGridPlugin, interactionPlugin]}
      borderless={true}
      initialView="timeGridWeek"
      allDaySlot={false}
      dayHeaderFormat={{ weekday: "short" }}
      editable={false}
      events={events}
      eventClass={styles["fc-event"]}
      eventInnerClass={styles["fc-event-inner"]}
      eventContent={renderEvent}
      eventClick={(e) => {
        // extendedProps: non-standard props of {@link Event.eventInputs}
        if (isActivity(e.event.extendedProps.activity)) {
          state.setViewedActivity(e.event.extendedProps.activity);
        }
      }}
      headerToolbar={false}
      height="auto"
      eventShortHeight={30}
      initialDate={(() => {
        const now = Temporal.Now.plainDateISO();
        return now.subtract({ days: now.dayOfWeek - 1 }).toString();
      })()}
      slotDuration={Temporal.Duration.from({ minutes: 30 })}
      slotHeaderContent={({ time }) => {
        const milliseconds = time?.milliseconds ?? 0;
        const hour = Temporal.Duration.from({ milliseconds }).total({
          unit: "hour",
        });
        return hour === 12
          ? "noon"
          : hour < 12
            ? `${hour.toString()} AM`
            : `${(hour - 12).toString()} PM`;
      }}
      slotHeaderInnerClass={styles["fc-slot-header-inner"]}
      slotHeaderDividerClass={styles["fc-slot-header-divider"]}
      dayLaneClass={styles["fc-day-lane"]}
      slotLaneClass={styles["fc-slot-lane"]}
      slotHeaderClass={styles["fc-slot-header"]}
      dayHeaderContent={({ text }) => text.toLocaleUpperCase()}
      dayHeaderInnerClass={styles["fc-day-header-inner"]}
      slotMinTime={
        events.some((e) => Temporal.PlainDateTime.from(e.start).hour < 8)
          ? Temporal.Duration.from({ hours: 6 })
          : Temporal.Duration.from({ hours: 8 })
      }
      slotMaxTime={Temporal.Duration.from({ hours: 22 })}
      weekends={false}
      selectable={viewedActivity instanceof CustomActivity}
      select={(e) => {
        if (viewedActivity instanceof CustomActivity) {
          state.addTimeslot(
            viewedActivity,
            Timeslot.fromStartEnd(
              Slot.fromStartDate(
                e.start
                  .toTemporalInstant()
                  .toZonedDateTimeISO(USER_TZ)
                  .toPlainDateTime(),
              ),
              Slot.fromStartDate(
                e.end
                  .toTemporalInstant()
                  .toZonedDateTimeISO(USER_TZ)
                  .toPlainDateTime(),
              ),
            ),
          );
        }
      }}
    />
  );
}

export function CalendarPanel() {
  const { hydrantState } = useHydrantContext();
  const hasOptions = hydrantState.totalOptions > 1;

  return (
    <Box gridArea="calendar">
      <Flex
        as="aside"
        aria-label="Calendar"
        direction="column"
        gap={2}
        py={{ lg: 2 }}
        // so the schedule options sit just under the logo
        mt={{ lg: hasOptions ? -7 : 0 }}
        css={{
          // pin only when the whole calendar fits
          "@media (min-width: 1024px) and (min-height: 880px)": {
            position: "sticky",
            top: 0,
            maxH: "100dvh",
            overflowY: "auto",
          },
        }}
      >
        <ScheduleOption />
        <Calendar />
      </Flex>
    </Box>
  );
}
