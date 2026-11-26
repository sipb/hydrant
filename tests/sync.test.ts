import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  RemoteScheduleFile,
  ScheduleContents,
  SyncScheduleOperation,
} from "../src/lib/auth";
import { Class } from "../src/lib/class";
import { COLOR_SCHEME_LIGHT } from "../src/lib/colors";
import { Term } from "../src/lib/dates";
import {
  CI,
  GIR,
  Level,
  SectionKind,
  TermCode,
  type RawClass,
} from "../src/lib/raw";
import type { DeflatedSave, HydrantState, Save } from "../src/lib/schema";
import { State } from "../src/lib/state";
import {
  fromScheduleContents,
  isEmptyState,
  notBefore,
  remoteName,
  agentName,
  deviceName,
  displayAgent,
  toScheduleContents,
} from "../src/lib/sync";

const rawClass: RawClass = {
  number: "6.1010",
  course: "6",
  subject: "1010",
  sectionKinds: [SectionKind.LECTURE, SectionKind.RECITATION],
  lectureRawSections: ["32-123/MW/0/11"],
  lectureSections: [[[[10, 2]], "32-123"]],
  recitationSections: [
    [[[20, 2]], "36-153"],
    [[[24, 2]], "36-155"],
  ],
  labSections: [],
  designSections: [],
  recitationRawSections: ["36-153/F/0/10", "36-155/F/0/12"],
  labRawSections: [],
  designRawSections: [],
  tba: false,
  hass: [],
  gir: GIR.EMPTY,
  comms: CI.EMPTY,
  lectureUnits: 2,
  labUnits: 2,
  preparationUnits: 8,
  level: Level.U,
  isVariableUnits: false,
  same: "",
  meets: "",
  terms: [TermCode.FA],
  prereqs: "None",
  description: "",
  name: "Fundamentals of Programming",
  inCharge: "",
  virtualStatus: false,
  rating: 6.0,
  hours: 12.0,
  size: 300,
  nonext: false,
  repeat: false,
  url: "",
  final: false,
  half: false,
  limited: false,
  oldNumber: "",
  new: false,
};

const classes = new Map([["6.1010", new Class(rawClass, COLOR_SCHEME_LIGHT)]]);

describe("toScheduleContents", () => {
  test("includes locked sections in Fireroad format", () => {
    const state: DeflatedSave = [[["6.1010", 0, 1]], null, 0, []];
    const contents = toScheduleContents(state, "f26", "Mine", classes);

    expect(contents.selectedSubjects).toEqual([
      {
        subject_id: "6.1010",
        title: "Fundamentals of Programming",
        units: 12,
        allowedSections: { Lecture: [0], Recitation: [1] },
        selectedSections: { Lecture: 0, Recitation: 1 },
      },
    ]);
    expect(contents.hydrant).toEqual({ term: "f26", name: "Mine", state });
  });

  test("skips color and room overrides, and unlocked sections", () => {
    const state: DeflatedSave = [
      [["6.1010", "#ff0000", ["", "34-101"], null, 0]],
      null,
      0,
    ];
    const [subject] = toScheduleContents(
      state,
      "f26",
      "Mine",
      classes,
    ).selectedSubjects;

    expect(subject.allowedSections).toEqual({ Recitation: [0] });
  });

  test("drops unknown classes", () => {
    const state: DeflatedSave = [["99.999"], null, 0, []];
    expect(
      toScheduleContents(state, "f26", "Mine", classes).selectedSubjects,
    ).toEqual([]);
  });
});

describe("fromScheduleContents", () => {
  test("prefers the Hydrant state", () => {
    const state: DeflatedSave = [
      ["6.1010"],
      [[[], "Lunch", "#ff0000", ""]],
      0,
      [],
    ];
    expect(
      fromScheduleContents(
        { selectedSubjects: [], hydrant: { term: "f26", name: "x", state } },
        classes,
      ),
    ).toBe(state);
  });

  test("falls back to subjects when the Hydrant state is missing", () => {
    const contents: ScheduleContents = {
      selectedSubjects: [
        {
          subject_id: "6.1010",
          title: "",
          units: 12,
          allowedSections: {},
          selectedSections: {},
        },
      ],
      hydrant: { term: "f26", name: "x" },
    };
    expect(fromScheduleContents(contents, classes)).toEqual([
      [["6.1010"]],
      null,
      0,
      [],
    ]);
  });

  test("reads iOS subjects that have no section fields", () => {
    const contents: ScheduleContents = {
      selectedSubjects: [{ subject_id: "6.1010", title: "", units: 12 }],
    };
    expect(fromScheduleContents(contents, classes)).toEqual([
      [["6.1010"]],
      null,
      0,
      [],
    ]);
  });

  test("falls back to locked sections from other clients", () => {
    const contents: ScheduleContents = {
      selectedSubjects: [
        {
          subject_id: "6.1010",
          title: "",
          units: 12,
          allowedSections: { Lecture: [0], Recitation: [0, 1] },
          selectedSections: {},
        },
        {
          subject_id: "99.999",
          title: "",
          units: 12,
          allowedSections: {},
          selectedSections: {},
        },
      ],
    };
    expect(fromScheduleContents(contents, classes)).toEqual([
      [["6.1010", 0], "99.999"],
      null,
      0,
      [],
    ]);
  });
});

test("isEmptyState", () => {
  expect(isEmptyState(null)).toBe(true);
  expect(isEmptyState([[], null, 0, []])).toBe(true);
  expect(isEmptyState([[], null, 0])).toBe(true);
  expect(isEmptyState([["6.1010"], null, 0, []])).toBe(false);
  expect(isEmptyState([[], [[[], "Lunch", "#ff0000", ""]], 0, []])).toBe(false);
  expect(isEmptyState([[], null, 0, ["PE.1"]])).toBe(false);
});

test("remoteName fits in 50 characters", () => {
  const fall = new Term({ urlName: "f26" });
  expect(remoteName("Schedule 1", fall)).toBe("Schedule 1 (Fall 2026)");
  const long = remoteName("x".repeat(60), fall);
  expect(long).toHaveLength(50);
  expect(long.endsWith(" (Fall 2026)")).toBe(true);
});

describe("device names", () => {
  test.each([
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      "Hydrant on Chrome (Windows)",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      "Hydrant on Edge (Windows)",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
      "Hydrant on Firefox (macOS)",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
      "Hydrant on Safari (macOS)",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1",
      "Hydrant on Mobile Chrome (iOS)",
    ],
    [
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
      "Hydrant on Mobile Chrome (Android)",
    ],
    [
      "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      "Hydrant on Chrome (Chrome OS)",
    ],
    ["curl/8.0", "Hydrant"],
  ])("%s", (userAgent, name) => {
    expect(deviceName(userAgent)).toBe(name);
  });

  test("agent ids are hidden when displayed", () => {
    const agent = agentName("Firefox/144.0 (X11; Linux x86_64)", "ab12");
    expect(agent).toBe("Hydrant on Firefox (Linux) #ab12");
    expect(displayAgent(agent)).toBe("Hydrant on Firefox (Linux)");
    expect(displayAgent("Diego's iPhone")).toBe("Diego's iPhone");
    expect(displayAgent("Anonymous")).toBeUndefined();
    expect(displayAgent("")).toBeUndefined();
  });
});

test("notBefore", () => {
  const early = "2026-10-21T18:00:00.000Z";
  const late = "2026-10-21T19:00:00.000000+00:00";
  expect(notBefore(early, late)).toBe(late);
  expect(notBefore(late, early)).toBe(late);
  expect(notBefore(early)).toBe(early);
});

// State sync against a fake Fireroad

const DATE = "2026-10-21T19:00:00.000000+00:00";
const LATER = "2026-10-21T20:00:00.000000+00:00";

const noChange = { success: true, result: "no_change", changed: DATE };
const updateRemote = (changed: string, id?: number) => ({
  success: true,
  result: "update_remote",
  changed,
  id,
});

/** Handler for /sync/schedules/: lists `files`, or returns the one in ?id=. */
const schedulesHandler =
  (files: RemoteScheduleFile[]) => (_: unknown, url: URL) => {
    const id = url.searchParams.get("id");
    return id === null
      ? {
          success: true,
          files: Object.fromEntries(
            files.map(({ id, name, changed, agent }) => [
              id,
              { name, changed, agent },
            ]),
          ),
        }
      : {
          success: true,
          file: files.find((file) => file.id.toString() === id),
        };
  };

interface Call {
  path: string;
  url: URL;
  body: unknown;
}

/** Stub fetch with handlers keyed by Fireroad path. */
function mockFireroad(
  handlers: Record<string, (body: unknown, url: URL) => unknown>,
): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const body: unknown =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    calls.push({ path: url.pathname, url, body });
    const handler = handlers[url.pathname] as
      ((body: unknown, url: URL) => unknown) | undefined;
    const result = handler
      ? handler(body, url)
      : url.pathname === "/prefs/favorites/"
        ? { success: true, favorites: [] }
        : { success: true, files: {} };
    return Promise.resolve(new Response(JSON.stringify(result)));
  });
  return calls;
}

const syncCalls = (calls: Call[]) =>
  calls
    .filter((call) => call.path === "/sync/sync_schedule/")
    .map((call) => call.body as SyncScheduleOperation);

function makeState() {
  const state = new State(
    new Map([["6.1010", rawClass]]),
    {},
    new Map(),
    new Term({ urlName: "f26" }),
    "",
    "f26",
  );
  const latest: { current?: HydrantState } = {};
  state.callback = (hydrantState) => {
    latest.current = hydrantState;
  };
  return { state, latest };
}

/** Run pending debounced syncs and wait for Fireroad requests to finish. */
async function settle(state: State) {
  for (let i = 0; i < 10; i++) {
    vi.runOnlyPendingTimers();
    await (state as unknown as { syncQueue: Promise<void> }).syncQueue;
  }
}

const storedSaves = () =>
  JSON.parse(localStorage.getItem("f26-saves") ?? "[]") as Save[];

describe("State schedule sync", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("doesn't push blank schedules", async () => {
    const calls = mockFireroad({});
    const { state } = makeState();

    state.loadAccessToken("token", "user");
    await settle(state);

    expect(syncCalls(calls)).toEqual([]);
  });

  test("creates a Fireroad file for a local schedule on login", async () => {
    const calls = mockFireroad({
      "/sync/sync_schedule/": () => updateRemote(DATE, 42),
    });
    const { state } = makeState();
    state.addActivity(state.classes.get("6.1010"));

    state.loadAccessToken("token", "user");
    await settle(state);

    const [op] = syncCalls(calls);
    expect(op.id).toBeUndefined();
    expect(op.downloaded).toBeUndefined();
    expect(op.name).toBe("Schedule 1 (Fall 2026)");
    expect(op.agent).toMatch(/^Hydrant.* #.{4}$/);
    expect(op.contents.hydrant?.term).toBe("f26");
    expect(op.contents.selectedSubjects[0].subject_id).toBe("6.1010");
    expect(storedSaves()[0].remote).toEqual({
      id: 42,
      user: "user",
      downloaded: DATE,
    });
  });

  test("pulls this term's schedules, replacing blank local ones", async () => {
    const calls = mockFireroad({
      "/sync/schedules/": schedulesHandler([
        {
          id: 7,
          name: "Mine (Fall 2026)",
          changed: DATE,
          downloaded: LATER,
          agent: "Hydrant on Firefox (macOS) #abcd",
          contents: {
            selectedSubjects: [],
            hydrant: {
              term: "f26",
              name: "Mine",
              state: [["6.1010"], null, 0, []],
            },
          },
        },
        {
          id: 8,
          name: "Old (Spring 2026)",
          changed: DATE,
          downloaded: LATER,
          agent: "Hydrant on Firefox (macOS) #abcd",
          contents: {
            selectedSubjects: [],
            hydrant: { term: "s26", name: "Old", state: [[], null, 0, []] },
          },
        },
      ]),
      "/sync/sync_schedule/": () => noChange,
    });
    const { state, latest } = makeState();

    state.loadAccessToken("token", "user");
    await settle(state);

    expect(storedSaves()).toEqual([
      {
        id: expect.any(String) as string,
        name: "Mine",
        changed: DATE,
        remote: { id: 7, user: "user", downloaded: DATE },
      },
    ]);
    expect(latest.current?.selectedActivities.map((a) => a.id)).toEqual([
      "6.1010",
    ]);
    // the other term's file is never downloaded
    expect(calls.some((call) => call.url.searchParams.get("id") === "8")).toBe(
      false,
    );
    expect(syncCalls(calls)[0]).toMatchObject({ id: 7, downloaded: LATER });
  });

  /** Fireroad with one schedule made in the iOS app, file 5. */
  function mockUntagged(onSync: (op: SyncScheduleOperation) => unknown) {
    return mockFireroad({
      "/sync/schedules/": schedulesHandler([
        {
          id: 5,
          name: "iOS plan",
          changed: DATE,
          downloaded: LATER,
          agent: "Diego's iPhone",
          contents: {
            selectedSubjects: [
              {
                subject_id: "6.1010",
                title: "",
                units: 12,
                allowedSections: { Recitation: [1] },
                selectedSections: {},
              },
            ],
          },
        },
      ]),
      "/sync/sync_schedule/": (body) => onSync(body as SyncScheduleOperation),
    });
  }

  test("lists schedules from other apps that have no term", async () => {
    mockUntagged(() => noChange);
    const { state, latest } = makeState();

    state.loadAccessToken("token", "user");
    await settle(state);

    expect(latest.current?.untaggedSchedules).toMatchObject([
      { remoteId: 5, name: "iOS plan", changed: DATE, subjects: ["6.1010"] },
    ]);
    expect(storedSaves()).toHaveLength(1);
  });

  test("tagging with this term adds the schedule here", async () => {
    const calls = mockUntagged(() => updateRemote(LATER));
    const { state, latest } = makeState();
    state.loadAccessToken("token", "user");
    await settle(state);

    state.importUntaggedSchedules({ 5: "f26" });
    await settle(state);

    const [tag, push] = syncCalls(calls);
    expect(tag).toMatchObject({
      id: 5,
      name: "iOS plan (Fall 2026)",
      downloaded: LATER,
      contents: { hydrant: { term: "f26", name: "iOS plan" } },
    });
    expect(tag.contents.hydrant?.state).toBeUndefined();
    expect(tag.contents.selectedSubjects).toHaveLength(1);
    // then the full Hydrant state is pushed, with the locked recitation
    expect(push.contents.hydrant?.state).toEqual([
      [["6.1010", null, 1]],
      null,
      0,
      [],
    ]);
    expect(latest.current?.untaggedSchedules).toEqual([]);
    expect(storedSaves().map((save) => save.name)).toEqual([
      "Schedule 1",
      "iOS plan",
    ]);
  });

  test("tagging with another term leaves it for that term", async () => {
    const calls = mockUntagged(() => updateRemote(LATER));
    const { state } = makeState();
    state.loadAccessToken("token", "user");
    await settle(state);

    state.importUntaggedSchedules({ 5: "s26" });
    await settle(state);

    expect(syncCalls(calls)).toMatchObject([
      {
        id: 5,
        name: "iOS plan (Spring 2026)",
        contents: { hydrant: { term: "s26" } },
      },
    ]);
    expect(storedSaves()).toHaveLength(1);
  });

  test("skipped schedules aren't asked about again", async () => {
    const calls = mockUntagged(() => noChange);
    const { state, latest } = makeState();
    state.loadAccessToken("token", "user");
    await settle(state);

    state.importUntaggedSchedules({ 5: null });
    expect(latest.current?.untaggedSchedules).toEqual([]);
    expect(syncCalls(calls)).toEqual([]);

    state.loadAccessToken(undefined);
    calls.length = 0;
    state.loadAccessToken("token", "user");
    await settle(state);

    expect(calls.some((call) => call.url.searchParams.get("id") === "5")).toBe(
      false,
    );
    expect(latest.current?.untaggedSchedules).toEqual([]);
  });

  test("dismissing asks again next login", async () => {
    mockUntagged(() => noChange);
    const { state, latest } = makeState();
    state.loadAccessToken("token", "user");
    await settle(state);

    state.dismissUntaggedSchedules();
    expect(latest.current?.untaggedSchedules).toEqual([]);

    state.loadAccessToken(undefined);
    state.loadAccessToken("token", "user");
    await settle(state);
    expect(latest.current?.untaggedSchedules).toHaveLength(1);
  });

  /** Log in with a schedule already synced as Fireroad file 42. */
  async function syncedState(onSync: (op: SyncScheduleOperation) => unknown) {
    let synced = false;
    const calls = mockFireroad({
      "/sync/sync_schedule/": (body) => {
        if (!synced) {
          synced = true;
          return updateRemote(DATE, 42);
        }
        return onSync(body as SyncScheduleOperation);
      },
      "/sync/delete_schedule/": () => ({ success: true }),
    });
    const { state, latest } = makeState();
    state.addActivity(state.classes.get("6.1010"));
    state.loadAccessToken("token", "user");
    await settle(state);
    return { state, latest, calls };
  }

  test("pushes local edits after a delay", async () => {
    const { state, calls } = await syncedState(() => updateRemote(LATER));

    state.renameSave(state.store.get("saves")?.[0].id ?? "", "Renamed");
    expect(syncCalls(calls)).toHaveLength(1);
    await settle(state);

    const op = syncCalls(calls)[1];
    expect(op).toMatchObject({
      id: 42,
      name: "Renamed (Fall 2026)",
      downloaded: DATE,
    });
    expect(storedSaves()[0].remote?.downloaded).toBe(LATER);
  });

  test("replaces the local schedule on update_local", async () => {
    const { state, latest } = await syncedState(() => ({
      success: true,
      result: "update_local",
      id: 42,
      name: "Remote (Fall 2026)",
      changed: LATER,
      downloaded: LATER,
      contents: {
        selectedSubjects: [],
        hydrant: { term: "f26", name: "Remote", state: [[], null, 0, []] },
      },
    }));

    state.renameSave(storedSaves()[0].id, "Renamed");
    await settle(state);

    expect(storedSaves()[0]).toMatchObject({
      name: "Remote",
      remote: { id: 42, downloaded: LATER },
    });
    expect(latest.current?.selectedActivities).toEqual([]);
  });

  /** Fireroad conflict response, where the other version has `classes`. */
  const conflict = (classes: string[] = []) => ({
    success: true,
    result: "conflict",
    other_name: "Remote (Fall 2026)",
    other_agent: "Hydrant on Firefox (macOS) #zzzz",
    other_date: LATER,
    other_contents: {
      selectedSubjects: [],
      hydrant: { term: "f26", name: "Remote", state: [classes, null, 0, []] },
    },
    this_agent: "",
    this_date: LATER,
  });

  test("keeping the local version on conflict overrides Fireroad", async () => {
    const { state, latest, calls } = await syncedState((op) =>
      op.override ? updateRemote(LATER) : conflict(),
    );

    state.renameSave(storedSaves()[0].id, "Renamed");
    await settle(state);
    expect(latest.current?.syncConflict).toMatchObject({
      saveName: "Renamed",
      otherAgent: "Hydrant on Firefox (macOS) #zzzz",
      deleted: false,
    });

    state.resolveSyncConflict("local");
    await settle(state);

    expect(latest.current?.syncConflict).toBeUndefined();
    expect(syncCalls(calls).at(-1)).toMatchObject({ id: 42, override: true });
    expect(storedSaves()[0].name).toBe("Renamed");
  });

  test("using the other version on conflict replaces local", async () => {
    const { state, latest } = await syncedState(() => conflict());

    state.renameSave(storedSaves()[0].id, "Renamed");
    await settle(state);
    state.resolveSyncConflict("remote");

    expect(latest.current?.syncConflict).toBeUndefined();
    expect(storedSaves()[0]).toMatchObject({
      name: "Remote",
      remote: { id: 42, downloaded: LATER },
    });
    expect(latest.current?.selectedActivities).toEqual([]);
  });

  test("keeping both on conflict adds the other version as a new save", async () => {
    const { state, latest, calls } = await syncedState((op) =>
      op.override
        ? updateRemote(LATER)
        : op.id === undefined
          ? updateRemote(LATER, 99)
          : // not blank, so the new save gets pushed
            conflict(["6.1010"]),
    );

    state.renameSave(storedSaves()[0].id, "Remote");
    await settle(state);
    state.resolveSyncConflict("both");
    await settle(state);

    expect(latest.current?.syncConflict).toBeUndefined();
    const saves = storedSaves();
    expect(saves.map((save) => save.name)).toEqual(["Remote", "Remote (2)"]);
    expect(saves.map((save) => save.remote?.id)).toEqual([42, 99]);
    const [override, created] = syncCalls(calls).slice(-2);
    expect(override).toMatchObject({ id: 42, override: true });
    expect(created.id).toBeUndefined();
    expect(created.name).toBe("Remote (2) (Fall 2026)");
  });

  test("removing a synced schedule deletes it from Fireroad", async () => {
    const { state, calls } = await syncedState(() => noChange);

    state.removeSave(storedSaves()[0].id);
    await settle(state);

    const deletes = calls.filter(
      (call) => call.path === "/sync/delete_schedule/",
    );
    expect(deletes.map((call) => call.body)).toEqual([{ id: 42 }]);
  });

  test("ignores Fireroad copies owned by another user", async () => {
    const { state, calls } = await syncedState(() => updateRemote(DATE, 43));

    state.loadAccessToken(undefined);
    state.loadAccessToken("token2", "someone-else");
    await settle(state);

    expect(syncCalls(calls).at(-1)?.id).toBeUndefined();
    expect(storedSaves()[0].remote).toMatchObject({
      id: 43,
      user: "someone-else",
    });
  });
});
