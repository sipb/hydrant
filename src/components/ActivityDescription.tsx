import { useContext } from "react";
import { decode } from "html-entities";

import {
  Flex,
  Heading,
  Image,
  Link,
  Text,
  Button,
  Span,
} from "@chakra-ui/react";
import { useColorModeValue } from "./ui/color-mode";
import { Tooltip } from "./ui/tooltip";

import { CustomActivity } from "../lib/activity";
import type { Flags } from "../lib/class";
import { Class, DARK_IMAGES, getFlagImg } from "../lib/class";
import { linkClasses } from "../lib/utils";
import { HydrantContext } from "../lib/hydrant";

import { ClassButtons, CustomActivityButtons } from "./ActivityButtons";
import { LuExternalLink } from "react-icons/lu";
import { type PEFlags } from "../lib/pe";
import { PEClass, getPEFlagEmoji } from "../lib/pe";

/** A small image indicating a flag, like Spring or CI-H. */
function ClassTypeSpan(props: { flag: keyof Flags; title: string }) {
  const { flag, title } = props;
  const filter = useColorModeValue(
    "",
    DARK_IMAGES.includes(flag) ? "invert()" : "",
  );

  return (
    <Tooltip content={title}>
      <Image
        alt={title}
        boxSize="1em"
        src={getFlagImg(flag)}
        display="inline-block"
        filter={filter}
      />
    </Tooltip>
  );
}

/** An emoji with tooltip indicating a flag, like Wellness Wizard. */
function PEClassTypeSpan(props: { flag: keyof PEFlags; title: string }) {
  const { flag, title } = props;

  return (
    <Tooltip content={title}>
      <Span>{getPEFlagEmoji(flag)}</Span>
    </Tooltip>
  );
}

/** Header for class description; contains flags and units. */
function ClassTypes(props: { cls: Class }) {
  const { cls } = props;
  const { state } = useContext(HydrantContext);
  const { flags, totalUnits, units } = cls;

  /**
   * Wrap a group of flags in ClassTypeSpans.
   *
   * @param arr - Arrays with [flag name, alt text].
   */
  const makeFlags = (arr: [keyof Flags, string][]) =>
    arr
      .filter(([flag, _]) => flags[flag])
      .map(([flag, title]) => (
        <ClassTypeSpan key={flag} flag={flag} title={title} />
      ));

  const currentYear = parseInt(state.term.fullRealYear);
  const nextAcademicYearStart =
    state.term.semester === "f" ? currentYear + 1 : currentYear;
  const nextAcademicYearEnd = nextAcademicYearStart + 1;

  const types1 = makeFlags([
    [
      "nonext",
      `Not offered ${nextAcademicYearStart.toString()}-${nextAcademicYearEnd.toString()}`,
    ],
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
    ["bio", "Biology"],
    ["calc1", "Calculus 1"],
    ["calc2", "Calculus 2"],
    ["chem", "Chemistry"],
    ["lab", "Institute LAB"],
    ["partLab", "Partial LAB"],
    ["phys1", "Physics 1"],
    ["phys2", "Physics 2"],
    ["rest", "REST"],
    ["hassH", "HASS-H"],
    ["hassA", "HASS-A"],
    ["hassS", "HASS-S"],
    ["hassE", "HASS-E"],
    ["cih", "CI-H"],
    ["cihw", "CI-HW"],
  ]);

  const halfType =
    flags.half === 1
      ? "; first half of term"
      : flags.half === 2
        ? "; second half of term"
        : "";

  const unitsDescription = cls.isVariableUnits
    ? "Units arranged"
    : `${totalUnits.toString()} units: ${units.join("-")}`;

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
      <Text>{unitsDescription}</Text>
      {flags.final ? <Text>Has final</Text> : null}
    </Flex>
  );
}

/** Header for PE class description; contains class size, points, and flags. */
function PEClassTypes(props: { cls: PEClass }) {
  const { cls } = props;
  const { flags } = cls;
  const { classSize, points, swimGIR } = cls.rawClass;

  /**
   * Wrap a group of flags in PEClassTypeSpans.
   *
   * @param arr - Arrays with [flag name, tooltip text].
   */
  const makeFlags = (arr: [keyof PEFlags, string][]) =>
    arr
      .filter(([flag, _]) => flags[flag])
      .map(([flag, title]) => (
        <PEClassTypeSpan key={flag} flag={flag} title={title} />
      ));

  const types = makeFlags([
    ["wellness", "Wellness Wizard eligible"],
    ["pirate", "Pirate Certificate eligible"],
  ]);

  return (
    <Flex gap={4} align="center">
      <Text>Class size: {classSize}</Text>
      <Text>Awards {points} PE points</Text>
      {swimGIR && <Text>Satisfies swim GIR</Text>}
      <Flex align="center">{types}</Flex>
    </Flex>
  );
}

/** List of related classes, appears after flags and before description. */
function ClassRelated(props: { cls: Class }) {
  const { cls } = props;
  const { state } = useContext(HydrantContext);
  const { prereq, same, meets } = cls.related;

  return (
    <>
      <Text>
        Prereq:{" "}
        <Span fontWeight={prereq.toLowerCase() === "none" ? "bold" : "normal"}>
          {linkClasses(state, prereq)}
        </Span>
      </Text>
      {same !== "" && <Text>Same class as: {linkClasses(state, same)}</Text>}
      {meets !== "" && <Text> Meets with: {linkClasses(state, meets)} </Text>}
    </>
  );
}

/** List of programs for which this class is a CI-M. */
function ClassCIM(props: { cls: Class }) {
  const { cls } = props;
  const { cim } = cls;

  const url =
    "https://registrar.mit.edu/registration-academics/academic-requirements/communication-requirement/ci-m-subjects/subject";

  if (cim.length > 0) {
    return (
      <Text>
        CI-M for: {cim.join("; ")} (
        <Link href={url} target="_blank" colorPalette="blue">
          more info
        </Link>
        )
      </Text>
    );
  } else {
    return null;
  }
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
function ClassBody(props: { cls: Class }) {
  const { cls } = props;
  const { state } = useContext(HydrantContext);
  const { description, inCharge, extraUrls } = cls.description;

  return (
    <Flex direction="column" gap={2}>
      <Text lang="en" style={{ hyphens: "auto", whiteSpace: "pre-wrap" }}>
        {linkClasses(state, decode(description))}
      </Text>
      {inCharge !== "" && <Text>In-charge: {inCharge}.</Text>}
      {extraUrls.length > 0 && (
        <Flex gap={4}>
          {extraUrls.map(({ label, url }) => (
            <Link
              key={label}
              href={url}
              target="_blank"
              colorPalette="blue"
              display="inline-block"
              flexGrow={1}
            >
              {label} <LuExternalLink style={{ display: "inline" }} />
            </Link>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

/** Full class description, from title to URLs at the end. */
function ClassDescription(props: { cls: Class }) {
  const { cls } = props;

  return (
    <Flex direction="column" gap={4}>
      <Heading size="md">
        {cls.number}: {cls.name}
      </Heading>
      <Flex direction="column" gap={0.5}>
        <ClassTypes cls={cls} />
        <ClassRelated cls={cls} />
        <ClassCIM cls={cls} />
        <ClassEval cls={cls} />
      </Flex>
      <ClassButtons cls={cls} />
      <ClassBody cls={cls} />
    </Flex>
  );
}

/** Full custom activity description, from title to timeslots. */
function CustomActivityDescription(props: { activity: CustomActivity }) {
  const { activity } = props;
  const { state } = useContext(HydrantContext);

  return (
    <Flex direction="column" gap={4}>
      <CustomActivityButtons activity={activity} />
      <Flex direction="column" gap={2}>
        {activity.timeslots.map((t) => (
          <Flex key={t.toString()} align="center" gap={2}>
            <Button
              size="sm"
              onClick={() => {
                state.removeTimeslot(activity, t);
              }}
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

/** Full PE&W class description, from title to URLs at the end. */
function PEClassDescription(props: { cls: PEClass }) {
  const { cls } = props;
  const { fee, startDate, endDate } = cls;
  const { number, name, prereqs, equipment, description } = cls.rawClass;

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const start = fmt.format(startDate);
  const end = fmt.format(endDate);

  const urls = [
    {
      label: "PE&W registration",
      url: "https://physicaleducationandwellness.mit.edu/registration-information/registration/",
    },
    {
      label: "Waitlist info",
      url: "https://physicaleducationandwellness.mit.edu/registration-information/registration/waitlist/",
    },
    {
      label: "Student history",
      url: "https://physicaleducationandwellness.mit.edu/my-gir/student-course-history/",
    },
    {
      label: "PE&W FAQs",
      url: "https://physicaleducationandwellness.mit.edu/faqs/",
    },
  ];

  return (
    <Flex direction="column" gap={4}>
      <Heading size="md">
        {number}: {name}
      </Heading>
      <Flex direction="column" gap={0.5}>
        <PEClassTypes cls={cls} />
        {fee ? <Text>${fee.toFixed(2)} enrollment fee</Text> : null}
        <Text>
          Begins {start}, ends {end}.
        </Text>
        <Text>Schedule subject to change once online registration opens.</Text>
      </Flex>
      <ClassButtons cls={cls} />
      <Flex direction="column" gap={2}>
        <Text lang="en" style={{ hyphens: "auto", whiteSpace: "pre-wrap" }}>
          {description}
        </Text>
        <Text>
          <Span fontWeight="medium">Prereq:</Span>{" "}
          <Span
            fontWeight={prereqs.toLowerCase() === "none" ? "bold" : "normal"}
          >
            {prereqs}
          </Span>
        </Text>
        <Text>
          <Span fontWeight="medium">Equipment:</Span>{" "}
          <Span
            fontWeight={equipment.toLowerCase() === "none" ? "bold" : "normal"}
          >
            {equipment}
          </Span>
        </Text>
      </Flex>
      <Flex gap={4}>
        {urls.map(({ label, url }) => (
          <Link
            key={label}
            href={url}
            target="_blank"
            colorPalette="blue"
            display="inline-block"
            flexGrow={1}
          >
            {label} <LuExternalLink style={{ display: "inline" }} />
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}

/** Activity description, whether class, PE class, or custom activity. */
export function ActivityDescription() {
  const { hydrantState } = useContext(HydrantContext);
  const { viewedActivity: activity } = hydrantState;
  if (!activity) {
    return null;
  }
  if (activity instanceof Class) {
    return <ClassDescription cls={activity} />;
  }
  if (activity instanceof PEClass) {
    return <PEClassDescription cls={activity} />;
  }
  if (activity instanceof CustomActivity) {
    return <CustomActivityDescription activity={activity} />;
  }

  activity satisfies never;
  // TODO throw error, or actually eliminate this case at the type level
}
