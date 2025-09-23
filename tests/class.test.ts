import { expect, test } from "vitest";
import { type Flags, getFlagImg, Class, Sections } from "../src/lib/class.js";
import type { RawClass } from "../src/lib/rawClass.js";
import { COLOR_SCHEME_LIGHT } from "../src/lib/colors.js";

// auxiliary object for testing getFlagImg; change as needed
const flagNameValidity: [keyof Flags, boolean][] = [
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
    'getFlagImg("%s")',
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

const myOtherRawClass: RawClass = {
  number: "21H.143",
  oldNumber: "",
  course: "21H",
  subject: "143",
  tba: false,
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
  recitationSections: [],
  labSections: [],
  designSections: [],
  recitationRawSections: [],
  labRawSections: [],
  designRawSections: [],
  hassH: true,
  hassA: false,
  hassS: false,
  hassE: false,
  cih: false,
  cihw: false,
  rest: false,
  lab: false,
  partLab: false,
  lectureUnits: 3,
  labUnits: 0,
  preparationUnits: 9,
  isVariableUnits: false,
  level: "U",
  same: "21G.056",
  meets: "21G.356",
  terms: ["FA"],
  prereqs: "None",
  description:
    "Provides an overview of European history from 1789 to the present. Explores how the ideas of 'European' and 'modern' have been defined over time. Explores major events and the evolution of major tensions and issues that consumed Europe and Europeans through the period, including questions of identity, inclusion/exclusion, religion, and equality. Places major emphasis on the fiction, visual culture, and films of the century as the products and evidence of political, social and cultural change. Taught in English.",
  name: "The 'Making' of Modern Europe: 1789-Present",
  inCharge: "E. Kempf",
  virtualStatus: false,
  nonext: false,
  repeat: false,
  url: "",
  final: false,
  half: false,
  limited: false,
  new: false,
  rating: 6.9,
  hours: 5.9,
  size: 9.5,
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

    test("Class.name with old number", () => {
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

    test("rated and new", () => {
      const modifiedRawClass: RawClass = { ...myRawClass, new: true };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.evals).toStrictEqual(naEvals);
    });

    test("unrated and not new", () => {
      const modifiedRawClass: RawClass = { ...myRawClass, rating: 0 };
      const myClass: Class = new Class(modifiedRawClass, COLOR_SCHEME_LIGHT);
      expect(myClass.evals).toStrictEqual(naEvals);
    });

    test("unrated and new", () => {
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

  describe("Class.warnings and Class.buttonName", () => {
    // Some type declarations to make the code cleaner
    interface Warnings {
      suffix: string;
      messages: string[];
    }

    type PartialRawClass = Partial<RawClass>;

    // Test each kind of warning individually; add more as desired
    const myTestData: [string, PartialRawClass, Warnings, string][] = [
      ["no warnings", {}, { suffix: "", messages: [] }, "21H.143"],
      [
        "TBA warning",
        { tba: true },
        {
          suffix: "+",
          messages: [
            "+ Class has at least one section yet to be scheduled—check course catalog.",
          ],
        },
        "21H.143+",
      ],
      [
        "No sections warning",
        { sectionKinds: [] },
        {
          suffix: "&",
          messages: [
            "& Class schedule is unknown—check course catalog or department website.",
          ],
        },
        "21H.143&",
      ],
      [
        "Variable units and hours = 0 warning",
        { isVariableUnits: true, hours: 0 },
        {
          suffix: "^",
          messages: [
            "^ This class has an arranged number of units and no evaluations, so it was not counted towards total units or hours.",
          ],
        },
        "21H.143^",
      ],
      [
        "Variable units and hours != 0 warning",
        { isVariableUnits: true },
        {
          suffix: "#",
          messages: [
            "# This class has an arranged number of units and its units were not counted in the total.",
          ],
        },
        "21H.143#",
      ],
      [
        "No evaluations warning",
        { hours: 0 },
        {
          suffix: "*",
          messages: [
            "* Class does not have evaluations, so its hours were set to units.",
          ],
        },
        "21H.143*",
      ],
    ];

    test.each(myTestData)(
      "%s",
      (
        _: string,
        modification: PartialRawClass,
        expectedWarnings: Warnings,
        expectedButtonName: string,
      ) => {
        const myModifiedRawClass: RawClass = { ...myRawClass, ...modification };
        const myClass: Class = new Class(
          myModifiedRawClass,
          COLOR_SCHEME_LIGHT,
        );
        expect(myClass.warnings).toStrictEqual(expectedWarnings);
        expect(myClass.buttonName).toStrictEqual(expectedButtonName);
      },
    );
  });

  describe("Class.description", () => {
    // Test each kind of extra URL individually

    // some variable declaration to make the testcases DRYer
    type ExtraUrlList = { label: string; url: string }[];
    interface Description {
      description: string;
      inCharge: string;
      extraUrls: ExtraUrlList;
    }
    const alwaysExpectedUrls: ExtraUrlList = [
      {
        label: "Course Catalog",
        url: `http://student.mit.edu/catalog/search.cgi?search=21H.143`,
      },
      {
        label: "Course Data on OpenGrades",
        url: `https://opengrades.mit.edu/classes/aggregate/21H.143?utm_source=hydrant`,
      },
      {
        label: "Class Evaluations",
        url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=21H.143`,
      },
    ];

    test("Fewest extra URLs", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      const myDescription: Description = myClass.description;
      expect(myDescription.description).toEqual(myRawClass.description);
      expect(myDescription.inCharge).toEqual("E. Kempf");
      expect(myDescription.extraUrls).toStrictEqual(alwaysExpectedUrls);
    });

    test("Has oldNumber", () => {
      const myModifiedRawClass: RawClass = {
        ...myRawClass,
        oldNumber: "21H.688", // fictitious old number
      };
      const myClass: Class = new Class(myModifiedRawClass, COLOR_SCHEME_LIGHT);
      const myDescription: Description = myClass.description;
      expect(myDescription.description).toEqual(myRawClass.description);
      expect(myDescription.inCharge).toEqual("E. Kempf");
      const expectedUrls: ExtraUrlList = [
        ...alwaysExpectedUrls.slice(0, -1), // remember to slice the last one off!
        {
          label: "Class Evaluations (for 21H.143)",
          url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=21H.143`,
        },
        {
          label: "Class Evaluations (for 21H.688)",
          url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=21H.688`,
        },
      ];
      expect(myDescription.extraUrls).toStrictEqual(expectedUrls);
    });

    test("course 6 and no oldNumber", () => {
      const myModifiedRawClass: RawClass = {
        ...myRawClass,
        course: "6",
      };
      const myClass: Class = new Class(myModifiedRawClass, COLOR_SCHEME_LIGHT);
      const myDescription: Description = myClass.description;
      expect(myDescription.description).toEqual(myRawClass.description);
      expect(myDescription.inCharge).toEqual("E. Kempf");
      const expectedUrls: ExtraUrlList = [
        ...alwaysExpectedUrls,
        {
          label: "HKN Underground Guide",
          url: `https://underground-guide.mit.edu/search?q=`, // NOTE: this will occur because oldNumber already exists as an empty string
        },
      ];
      expect(myDescription.extraUrls).toStrictEqual(expectedUrls);
    });

    test("course 6 and oldNumber", () => {
      const myModifiedRawClass: RawClass = {
        ...myRawClass,
        course: "6",
        oldNumber: "6.2384483", // fictitious course number
      };
      const myClass: Class = new Class(myModifiedRawClass, COLOR_SCHEME_LIGHT);
      const myDescription: Description = myClass.description;
      expect(myDescription.description).toEqual(myRawClass.description);
      expect(myDescription.inCharge).toEqual("E. Kempf");
      const expectedUrls: ExtraUrlList = [
        ...alwaysExpectedUrls.slice(0, -1),
        {
          label: "Class Evaluations (for 21H.143)",
          url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=21H.143`,
        },
        {
          label: "Class Evaluations (for 6.2384483)",
          url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=6.2384483`,
        },
        {
          label: "HKN Underground Guide",
          url: `https://underground-guide.mit.edu/search?q=6.2384483`,
        },
      ];
      expect(myDescription.extraUrls).toStrictEqual(expectedUrls);
    });

    test("course 18", () => {
      const myModifiedRawClass: RawClass = {
        ...myRawClass,
        course: "18",
      };
      const myClass: Class = new Class(myModifiedRawClass, COLOR_SCHEME_LIGHT);
      const myDescription: Description = myClass.description;
      expect(myDescription.description).toEqual(myRawClass.description);
      expect(myDescription.inCharge).toEqual("E. Kempf");
      const expectedUrls: ExtraUrlList = [
        ...alwaysExpectedUrls,
        {
          label: "Course 18 Underground Guide",
          url: `https://mathguide.mit.edu/21H.143`,
        },
      ];
      expect(myDescription.extraUrls).toStrictEqual(expectedUrls);
    });
  });

  describe("Class.deflate and Class.inflate", () => {
    /**
     * Partition:
     * - has unlocked sections, doesn't have unlocked sections
     * - has manual color, no manual color
     * - has section room overrides, doesn't have section room overrides
     */

    type Deflated = (string | number | string[])[];

    test("no unlocked sections, no manual color, no section room overrides", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      const expectedDeflated: Deflated = ["21H.143", [""]];
      expect(myClass.deflate()).toStrictEqual(expectedDeflated);

      const myOtherClass: Class = new Class(
        myOtherRawClass,
        COLOR_SCHEME_LIGHT,
      );
      myOtherClass.inflate(expectedDeflated);
      expect(myClass).toStrictEqual(myOtherClass);
    });

    test("has unlocked sections", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      const mySections: Sections | undefined = myClass.sections.at(0);
      assert(mySections instanceof Sections);
      mySections.locked = true;
      const expectedDeflated: Deflated = ["21H.143", [""], -1];
      expect(myClass.deflate()).toStrictEqual(expectedDeflated);

      const myOtherClass: Class = new Class(
        myOtherRawClass,
        COLOR_SCHEME_LIGHT,
      );
      myOtherClass.inflate(expectedDeflated);
      const myOtherSections: Sections | undefined = myOtherClass.sections.at(0);
      assert(myOtherSections instanceof Sections);
      // If you don't change this, it is `undefined` (TODO: fix!)
      myOtherSections.selected = null;
      expect(myClass).toStrictEqual(myOtherClass);
    });

    test("has manual color", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      myClass.manualColor = true;
      const expectedDeflated: Deflated = ["21H.143", "#4A5568", [""]];
      expect(myClass.deflate()).toStrictEqual(expectedDeflated);

      const myOtherClass: Class = new Class(
        myOtherRawClass,
        COLOR_SCHEME_LIGHT,
      );
      myOtherClass.inflate(expectedDeflated);
      expect(myClass).toStrictEqual(myOtherClass);
    });

    test("has section room override", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      const mySections: Sections | undefined = myClass.sections.at(0);
      assert(mySections instanceof Sections);
      mySections.roomOverride = "lorem";
      const expectedDeflated: Deflated = ["21H.143", ["lorem"]];
      expect(myClass.deflate()).toStrictEqual(expectedDeflated);

      const myOtherClass: Class = new Class(
        myOtherRawClass,
        COLOR_SCHEME_LIGHT,
      );
      myOtherClass.inflate(expectedDeflated);
      expect(myClass).toStrictEqual(myOtherClass);
    });

    test("Class.inflate with string input", () => {
      const myClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      const myOtherClass: Class = new Class(myRawClass, COLOR_SCHEME_LIGHT);
      myClass.inflate("alpha beta gamma delta");
      expect(myClass).toStrictEqual(myOtherClass);
    });
  });
});

describe("Sections", () => {
  test.skip("Sections.constructor");

  describe("Sections.shortName", () => {
    // One test per section type
    test.skip("SectionKind.LECTURE");

    test.skip("SectionKind.RECITATION");

    test.skip("SectionKind.LAB");

    test.skip("SectionKind.DESIGN");
  });

  describe("Sections.name", () => {
    // as before, one test per section type
    test.skip("SectionKind.LECTURE");

    test.skip("SectionKind.RECITATION");

    test.skip("SectionKind.LAB");

    test.skip("SectionKind.DESIGN");
  });

  test.skip("Sections.event");

  describe("Sections.lockSection", () => {
    test.skip("SectionLockOption is Auto");

    test.skip("SectionLockOption is None");

    test.skip("SectionLockOption instance of Section");
  });
});

describe("Section", () => {
  test.skip("Section.constructor");

  describe("Section.parsedTime", () => {
    test.skip("isEvening true");

    test.skip("isEvening false");
  });

  describe("Section.countConflicts", () => {
    test.skip("no conflicts");

    test.skip("has conflicts");
  });
});
