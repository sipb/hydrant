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

function makeStateWithStarredClasses(
  starredClasses: Set<string>,
  classes: Class[],
): State {
  const state = Object.create(State.prototype) as State;
  (state as unknown as { starredClasses: Set<string> }).starredClasses =
    starredClasses;
  (state as unknown as { store: { set: () => void } }).store = {
    set: () => undefined,
  };
  (state as unknown as { updateState: () => void }).updateState = () =>
    undefined;
  (state as unknown as { classes: Map<string, Class> }).classes = new Map(
    classes.map((cls) => [cls.number, cls]),
  );
  return state;
}

describe("State.isClassStarred", () => {
  test("class is not starred", () => {
    const cls = makeClass("6.009", false);
    const state = makeStateWithStarredClasses(new Set(), [cls]);
    expect(state.isClassStarred(cls)).toBe(false);
  });

  test("class is starred", () => {
    const cls = makeClass("6.009", false);
    const state = makeStateWithStarredClasses(new Set(["6.009"]), [cls]);
    expect(state.isClassStarred(cls)).toBe(true);
  });
});

describe("State.toggleStarClass", () => {
  test("starring an unstarred class", () => {
    const cls = makeClass("6.031", false);
    const state = makeStateWithStarredClasses(new Set(), [cls]);
    state.toggleStarClass(cls);
    expect(state.isClassStarred(cls)).toBe(true);
  });

  test("unstarring a starred class", () => {
    const cls = makeClass("6.031", false);
    const state = makeStateWithStarredClasses(new Set(["6.031"]), [cls]);
    state.toggleStarClass(cls);
    expect(state.isClassStarred(cls)).toBe(false);
  });
});

describe("State.getStarredClasses", () => {
  test("no starred classes", () => {
    const state = makeStateWithStarredClasses(new Set(), []);
    expect(state.getStarredClasses()).toStrictEqual([]);
  });

  test("one starred class", () => {
    const cls = makeClass("8.01", false);
    const state = makeStateWithStarredClasses(new Set(["8.01"]), [cls]);
    expect(state.getStarredClasses()).toStrictEqual([cls]);
  });

  test("multiple starred classes", () => {
    const cls1 = makeClass("8.01", false);
    const cls2 = makeClass("18.06", false);
    const state = makeStateWithStarredClasses(new Set(["8.01", "18.06"]), [
      cls1,
      cls2,
    ]);
    expect(state.getStarredClasses()).toStrictEqual([cls1, cls2]);
  });
});
