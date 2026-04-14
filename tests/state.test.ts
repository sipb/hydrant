import { expect, test, describe } from "vitest";
import { State } from "../src/lib/state";
import { Class } from "../src/lib/class";
import { COLOR_SCHEME_LIGHT } from "../src/lib/colors";
import {
  CI,
  GIR,
  HASS,
  Level,
  SectionKind,
  TermCode,
  type RawClass,
} from "../src/lib/raw";

if (!("Temporal" in globalThis)) {
  await import("temporal-polyfill/global");
}

const baseRawClass: RawClass = {
  number: "21H.143",
  course: "21H",
  subject: "143",
  sectionKinds: [SectionKind.LECTURE],
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
  tba: false,
  hass: [HASS.H],
  gir: GIR.EMPTY,
  comms: CI.EMPTY,
  lectureUnits: 3,
  labUnits: 0,
  preparationUnits: 9,
  level: Level.U,
  isVariableUnits: false,
  same: "",
  meets: "",
  terms: [TermCode.FA],
  prereqs: "None",
  description: "Test class description.",
  name: "Test Class",
  inCharge: "Test Instructor",
  virtualStatus: false,
  rating: 7.0,
  hours: 10.0,
  size: 20,
  nonext: false,
  repeat: false,
  url: "",
  final: false,
  half: false,
  limited: false,
  oldNumber: "",
  new: false,
};

function makeClass(number: string, hasFinal: boolean): Class {
  return new Class(
    {
      ...baseRawClass,
      number,
      subject: number.split(".")[1] ?? number,
      final: hasFinal,
    },
    COLOR_SCHEME_LIGHT,
  );
}

function makeStateWithClasses(classes: Class[]): State {
  const state = Object.create(State.prototype) as State;
  (state as unknown as { selectedClasses: Class[] }).selectedClasses = classes;
  return state;
}

describe("State.finalsCount", () => {
  test("no selected classes → 0", () => {
    const state = makeStateWithClasses([]);
    expect(state.finalsCount).toBe(0);
  });

  test("selected classes, none with finals = 0", () => {
    const state = makeStateWithClasses([
      makeClass("6.100A", false),
      makeClass("18.06", false),
      makeClass("8.01", false),
    ]);
    expect(state.finalsCount).toBe(0);
  });

  test("selected classes, all with finals = count equals array length", () => {
    const state = makeStateWithClasses([
      makeClass("6.004", true),
      makeClass("6.006", true),
    ]);
    expect(state.finalsCount).toBe(2);
  });

  test("mixed finals: 2 with finals, 1 without = 2", () => {
    const state = makeStateWithClasses([
      makeClass("6.031", true),
      makeClass("6.036", false),
      makeClass("6.046", true),
    ]);
    expect(state.finalsCount).toBe(2);
  });

  test("exactly 1 class with a final = 1", () => {
    const state = makeStateWithClasses([makeClass("6.009", true)]);
    expect(state.finalsCount).toBe(1);
  });
});
