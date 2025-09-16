import { expect, test } from "vitest";
import { Flags, getFlagImg, Class } from "../src/lib/class.js";
import { RawClass } from "../src/lib/rawClass.js";
import { COLOR_SCHEME_LIGHT } from "../src/lib/colors.js";

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

// random example of a real class!
const myRawClass: RawClass = {
  number: "21H.143",
  course: "21H",
  subject: "143",
  sectionKinds: ["lecture"],
  lectureRawSections: ["56-191/MW/0/11-12.30"],
  lectureSections: [
    [
      [
        [10, 3],
        [78, 3],
      ],
      "56-191",
    ],
  ],
  tba: false,
  hassH: true,
  hassA: false,
  hassS: false,
  hassE: false,
  rest: false,
  lab: false,
  partLab: false,
  lectureUnits: 3,
  labUnits: 0,
  preparationUnits: 9,
  level: "U",
  isVariableUnits: false,
  same: "21G.056",
  meets: "21G.356",
  terms: ["FA"],
  prereqs: "None",
  description:
    "Provides an overview of European history from 1789 to the present. Explores how the ideas of 'European' and 'modern' have been defined over time. Explores major events and the evolution of major tensions and issues that consumed Europe and Europeans through the period, including questions of identity, inclusion/exclusion, religion, and equality. Places major emphasis on the fiction, visual culture, and films of the century as the products and evidence of political, social and cultural change. Taught in English.",
  name: "The 'Making' of Modern Europe: 1789-Present",
  inCharge: "E. Kempf",
  virtualStatus: false,
  rating: 6.9,
  hours: 5.9,
  size: 9.5,
  nonext: false,
  repeat: false,
  url: "",
  final: false,
  half: false,
  limited: false,
  oldNumber: "",
  recitationSections: [],
  labSections: [],
  designSections: [],
  recitationRawSections: [],
  labRawSections: [],
  designRawSections: [],
  cih: false,
  cihw: false,
  new: false,
};

describe("Class", () => {
  test("Class.constructor", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.rawClass).toStrictEqual(myRawClass);
    expect(myClass.backgroundColor).toEqual("#4A5568");
  });

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
