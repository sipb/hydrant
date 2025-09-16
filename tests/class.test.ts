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

describe("getFlagImg", () => {
  test.each(flagNameValidity)(
    'getFlagImg(\"%s\")',
    (flagName: keyof Flags, validity: boolean) => {
      expect.soft(Boolean(getFlagImg(flagName))).toStrictEqual(validity);
    },
  );
});

// random example of a real class! used as test data
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
    expect(myClass.rawClass).toBe(myRawClass); // NOTE: they should be reference-equal
    expect(myClass.backgroundColor).toEqual("#4A5568");
    // TODO: test myClass.sections
  });

  test("Class.id", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.id).toEqual("21H.143");
  });

  describe("Class.name", () => {
    test("Class.name without old number", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.name).toEqual(
        "The 'Making' of Modern Europe: 1789-Present",
      );
    });

    test.skip("Class.name with old number", () => {
      const modifiedRawClass: RawClass = {
        ...myRawClass,
        oldNumber: "21H.206", // fictitious course number
      };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.name).toEqual(
        "[21H.206] The 'Making' of Modern Europe: 1789-Present",
      );
    });
  });

  test.skip("Class.buttonName");

  test("Class.number", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.number).toEqual("21H.143");
  });

  test("Class.oldNumber", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.oldNumber).toEqual("");
  });

  test("Class.course", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.course).toEqual("21H");
  });

  test("Class.units", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.units).toEqual([3, 0, 9]);
  });

  test("Class.isVariableUnits", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.isVariableUnits).toEqual(false);
  });

  test("Class.totalUnits", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.totalUnits).toEqual(12);
  });

  test("Class.hours", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.hours).toEqual(5.9);
  });

  describe("Class.half", () => {
    // Partition by value
    test("Class.half = undefined", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.half).toEqual(undefined);
    });

    test("Class.half = 1", () => {
      const modifiedRawClass: RawClass = { ...myRawClass, half: 1 };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.half).toEqual(1);
    });

    test("Class.half = 2", () => {
      const modifiedRawClass: RawClass = { ...myRawClass, half: 2 };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.half).toEqual(2);
    });
  });

  test("Class.new", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.new).toEqual(false);
  });

  test.skip("Class.events");

  test("Class.flags", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    const expectedFlags: Flags = {
      nonext: false,
      under: true,
      grad: false,
      fall: true,
      iap: false,
      spring: false,
      summer: false,
      repeat: false,
      rest: false,
      Lab: false,
      PartLab: false,
      hass: true,
      hassH: true,
      hassA: false,
      hassS: false,
      hassE: false,
      cih: false,
      cihw: false,
      notcih: true,
      cim: false,
      final: false,
      nofinal: true,
      nopreq: true,
      le9units: false,
      half: false,
      limited: false,
    };
    expect(myClass.flags).toStrictEqual(expectedFlags);
  });

  test("Class.cim", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    expect(myClass.cim).toStrictEqual([]);
  });

  describe("Class.evals", () => {
    // type declaration for type safety; could be moved into the main code instead
    type Evals = InstanceType<typeof Class>["evals"];

    // this constant could also be moved into the main code too
    const naEvals: Evals = {
      rating: "N/A",
      hours: "N/A",
      people: "N/A",
    };

    test("rated and not new", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      const expectedEvals: Evals = {
        rating: "6.9/7.0",
        hours: "5.9",
        people: "9.5",
      };
      expect(myClass.evals).toStrictEqual(expectedEvals);
    });

    test.skip("rated and new", () => {
      const modifiedRawClass: RawClass = { ...myRawClass, new: true };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.evals).toStrictEqual(naEvals);
    });

    test.skip("unrated and not new", () => {
      const modifiedRawClass: RawClass = { ...myRawClass, rating: 0 };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.evals).toStrictEqual(naEvals);
    });

    test.skip("unrated and new", () => {
      const modifiedRawClass: RawClass = {
        ...myRawClass,
        new: true,
        rating: 0,
      };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.evals).toStrictEqual(naEvals);
    });
  });

  test("Class.related", () => {
    const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
    const myRelated: InstanceType<typeof Class>["related"] = {
      prereq: "None",
      same: "21G.056",
      meets: "21G.356",
    };
    expect(myClass.related).toStrictEqual(myRelated);
  });

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
