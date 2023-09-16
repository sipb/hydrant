import {
  Button,
  Flex,
  Heading,
  Image,
  Link,
  Text,
  Tooltip,
  useColorMode,
} from "@chakra-ui/react";
import { decode } from "html-entities";
import { ReactNode } from "react";

import { Activity, NonClass } from "../lib/activity";
import { Class, Flags } from "../lib/class";
import { State } from "../lib/state";
import { linkClasses } from "../lib/utils";

import { ClassButtons, NonClassButtons } from "./ActivityButtons";

const DARK_IMAGES = ["cih", "iap", "repeat", "rest"];

/** A small image indicating a flag, like Spring or CI-H. */
function TypeSpan(props: { flag?: string; title: string }) {
  const { flag, title } = props;
  const { colorMode } = useColorMode();
  const filter =
    colorMode === "dark" && DARK_IMAGES.includes(flag ?? "") ? "invert()" : "";

  return flag ? (
    <Tooltip label={title}>
      <Image
        alt={title}
        boxSize="1em"
        src={`img/${flag}.gif`}
        display="inline-block"
        filter={filter}
      />
    </Tooltip>
  ) : (
    <>{title}</>
  );
}

/** Header for class description; contains flags and related classes. */
function ClassTypes(props: { cls: Class, state: State }) {
  const { cls, state } = props;
  const { flags, totalUnits, units } = cls;

  /**
   * Wrap a group of flags in TypeSpans.
   *
   * @param arr - Arrays with [flag name, alt text].
   */
  const makeFlags = (arr: Array<[keyof Flags, string]>) =>
    arr
      .filter(([flag, _]) => flags[flag])
      .map(([flag, title]) => (
        <TypeSpan key={flag} flag={flag} title={title} />
      ));
  
  const currentYear = parseInt(state.term.fullRealYear);
  const nextAcademicYearStart = state.term.semester === "f" ? currentYear + 1 : currentYear;
  const nextAcademicYearEnd = nextAcademicYearStart + 1;

  const types1 = makeFlags([
    ["nonext", `Not offered ${nextAcademicYearStart}-${nextAcademicYearEnd}`],
    ["under", "Undergrad"],
    ["grad", "Graduate"],
  ]);

  const seasons = makeFlags([
    ["fall", "Fall"],
    ["iap", "IAP"],
    ["spring", "Spring"],
    ["summer", "Summer"],
  ])
    .map((tag) => [tag, ", "])
    .flat()
    .slice(0, -1);

  const types2 = makeFlags([
    ["repeat", "Can be repeated for credit"],
    ["rest", "REST"],
    ["Lab", "Institute Lab"],
    ["PartLab", "Partial Institute Lab"],
    ["hassH", "HASS-H"],
    ["hassA", "HASS-A"],
    ["hassS", "HASS-S"],
    ["hassE", "HASS-E"],
    ["cih", "CI-H"],
    ["cihw", "CI-HW"],
  ]);

  const halfType =
    flags.half === 1 ? (
      <TypeSpan title="; first half of term" />
    ) : flags.half === 2 ? (
      <TypeSpan title="; second half of term" />
    ) : (
      ""
    );

  return (
    <Flex gap={4} align="center">
      <Flex align="center">
        {types1}
        <Flex mx={1} align="center">
          ({seasons})
        </Flex>
        <Flex gap={1}>{types2}</Flex>
        {halfType}
      </Flex>
      <Text>
        {totalUnits} units: {units.join("-")}
      </Text>
      {flags.final ? <Text>Has final</Text> : null}
    </Flex>
  );
}

/** List of related classes, appears after flags and before description. */
function ClassRelated(props: { cls: Class; state: State }) {
  const { cls, state } = props;
  const { prereq, same, meets } = cls.related;

  return (
    <>
      <Text>Prereq: {linkClasses(state, prereq)}</Text>
      {same !== "" && <Text>Same class as: {linkClasses(state, same)}</Text>}
      {meets !== "" && (
        <Text> Meets with: {linkClasses(state, meets)} </Text>
      )}
    </>
  );
}

/** Class evaluation info. */
function ClassEval(props: { cls: Class }) {
  const { cls } = props;
  const { rating, hours, people } = cls.evals;

  return (
    <Flex gap={4}>
      <Text>Rating: {rating}</Text>
      <Text>Hours: {hours}</Text>
      <Text>Avg # of students: {people}</Text>
    </Flex>
  );
}

/** Class description, person in-charge, and any URLs afterward. */
function ClassBody(props: { cls: Class; state: State }) {
  const { cls, state } = props;
  const { description, inCharge, extraUrls } = cls.description;

  return (
    <Flex direction="column" gap={2}>
      <Text lang="en" style={{ hyphens: "auto" }}>
        {linkClasses(state, decode(description))}
      </Text>
      {inCharge !== "" && <Text>In-charge: {inCharge}.</Text>}
      {extraUrls.length > 0 && (
        <Flex gap={4}>
          {extraUrls.map<ReactNode>(({ label, url }) => (
            <Link key={label} href={url} target="_blank">
              {label}
            </Link>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

/** Full class description, from title to URLs at the end. */
function ClassDescription(props: { cls: Class; state: State }) {
  const { cls, state } = props;

  return (
    <Flex direction="column" gap={4}>
      <Heading size="sm">
        {cls.number}: {cls.name}
      </Heading>
      <Flex direction="column" gap={0.5}>
        <ClassTypes cls={cls} state={state} />
        <ClassRelated cls={cls} state={state} />
        <ClassEval cls={cls} />
      </Flex>
      <ClassButtons cls={cls} state={state} />
      <ClassBody cls={cls} state={state} />
    </Flex>
  );
}

/** Full non-class activity description, from title to timeslots. */
function NonClassDescription(props: {
  activity: NonClass;
  state: State;
}) {
  const { activity, state } = props;

  return (
    <Flex direction="column" gap={4}>
      <NonClassButtons activity={activity} state={state} />
      <Flex direction="column" gap={2}>
        {activity.timeslots?.map((t) => (
          <Flex key={t.toString()} align="center" gap={2}>
            <Button
              size="sm"
              onClick={() => state.removeTimeslot(activity, t)}
            >
              Remove
            </Button>
            <Text>{t.toString()}</Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

/** Activity description, whether class or non-class. */
export function ActivityDescription(props: {
  activity: Activity;
  state: State;
}) {
  const { activity, state } = props;

  return activity instanceof Class ? (
    <ClassDescription cls={activity} state={state} />
  ) : (
    <NonClassDescription activity={activity} state={state} />
  );
}
