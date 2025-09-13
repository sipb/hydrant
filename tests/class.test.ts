import { expect, test } from "vitest";
import { Flags, getFlagImg } from "../src/lib/class.js";

// auxiliary object for testing getFlagImg; change as needed
const flagNameValidity: Array<[keyof Flags, boolean]> = [
  ["cim", false],
  ["final", false],
  ["half", false],
  ["hass", false],
  ["le9units", false],
  ["limited", false],
  ["nofinal", false],
  ["nopreq", false],
  ["notcih", false],
  ["Lab", true],
  ["PartLab", true],
  ["cih", true],
  ["cihw", true],
  ["fall", true],
  ["grad", true],
  ["hassA", true],
  ["hassE", true],
  ["hassH", true],
  ["hassS", true],
  ["iap", true],
  ["nonext", true],
  ["repeat", true],
  ["rest", true],
  ["spring", true],
  ["summer", true],
  ["under", true],
];

test.each(flagNameValidity)(
  'getFlagImg(\"%s\")',
  (flagName: keyof Flags, validity: boolean) => {
    expect.soft(Boolean(getFlagImg(flagName))).toStrictEqual(validity);
  },
);

// TODO: figure out how to construct these objects to begin with
describe("Class", () => {
  test.skip("Class.constructor");

  test.skip("Class.id");

  test.skip("Class.name");

  test.skip("Class.buttonName");

  test.skip("Class.number");

  test.skip("Class.oldNumber");

  test.skip("Class.course");

  test.skip("Class.units");

  test.skip("Class.isVariableUnits");

  test.skip("Class.totalUnits");

  test.skip("Class.hours");

  test.skip("Class.half");

  test.skip("Class.new");

  test.skip("Class.events");

  test.skip("Class.flags");

  test.skip("Class.cim");

  test.skip("Class.evals");

  test.skip("Class.related");

  test.skip("Class.warnings");

  test.skip("Class.description");

  test.skip("Class.deflate");

  test.skip("Class.inflate");
});

describe("Sections", () => {
  test.skip("Sections.constructor");

  test.skip("Sections.shortName");

  test.skip("Sections.name");

  test.skip("Sections.event");

  test.skip("Sections.lockSection");
});

describe("Section", () => {
  test.skip("Section.constructor");

  test.skip("Section.parsedTime");

  test.skip("Section.countConflicts");
});
