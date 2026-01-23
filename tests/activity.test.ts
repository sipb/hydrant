import { expect, test, describe } from "vitest";
import { Timeslot, CustomActivity, Event } from "../src/lib/activity";
import { Slot } from "../src/lib/dates";
import {
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT_CONTRAST,
  COLOR_SCHEME_DARK_CONTRAST,
} from "../src/lib/colors";

describe("Timeslot", () => {
  test("Timeslot.fromStartEnd", () => {
    const myStart: Slot = new Slot(2);
    const myEnd: Slot = new Slot(120);
    const myTimeslot: Timeslot = Timeslot.fromStartEnd(myStart, myEnd);

    expect(myTimeslot.startTime).toStrictEqual(myStart.startDate);
    expect(myTimeslot.endSlot).toStrictEqual(myEnd);
  });

  test("Timeslot.endSlot", () => {
    const myTimeslot: Timeslot = new Timeslot(131, 4); // numbers generated with the help of an RNG; adjust as needed
    expect(myTimeslot.endSlot).toStrictEqual(new Slot(135));
  });

  test("Timeslot.startTime", () => {
    const myTimeslot: Timeslot = new Timeslot(22, 43); // note: slot 22 is Monday at 5:00 PM
    expect(myTimeslot.startTime).toStrictEqual(
      new Date(2001, 0, 1, 17, 0, 0, 0),
    );
  });

  test("Timeslot.endTime", () => {
    const myTimeslot: Timeslot = new Timeslot(79, 52); // note: slot 79 + 52 = 131 is Thursday at 8:30 PM
    expect(myTimeslot.endTime).toStrictEqual(
      new Date(2001, 0, 4, 20, 30, 0, 0),
    );
  });

  test("Timeslot.hours", () => {
    const myTimeslot: Timeslot = new Timeslot(9, 14);
    expect(myTimeslot.hours).toBe(7);
  });

  describe("Timeslot.conflicts", () => {
    // PARTITION: all possible orderings of this.startSlot, this.endSlot, other.startSlot, other.endSlot (excluding edge cases)
    // NOTE: all of the timezone start and end points were randomly generated

    test("this.startSlot < this.endSlot < other.startSlot < other.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(18, 115); // slots 18 - 133
      const otherSlot: Timeslot = new Timeslot(135, 21); // slots 135 - 156
      expect(mySlot.conflicts(otherSlot)).toBe(false);
    });

    test("this.startSlot < other.startSlot < this.endSlot < other.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(73, 27); // slots 73 - 99
      const otherSlot: Timeslot = new Timeslot(80, 36); // slots 80 - 116
      expect(mySlot.conflicts(otherSlot)).toBe(true);
    });

    test("this.startSlot < other.startSlot < other.endSlot < this.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(36, 125); // slots 36 - 161
      const otherSlot: Timeslot = new Timeslot(120, 19); // slots 120 - 139
      expect(mySlot.conflicts(otherSlot)).toBe(true);
    });

    test("other.startSlot < this.startSlot < this.endSlot < other.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(37, 11); // slots 37 - 48
      const otherSlot: Timeslot = new Timeslot(35, 121); // slots 35 - 156
      expect(mySlot.conflicts(otherSlot)).toBe(true);
    });

    test("other.startSlot < this.startSlot < other.endSlot < this.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(118, 55); // slots 118 - 163
      const otherSlot: Timeslot = new Timeslot(73, 69); // slots 73 - 142
      expect(mySlot.conflicts(otherSlot)).toBe(true);
    });

    test("other.startSlot < other.endSlot < this.startSlot < this.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(112, 42); // slots 112 - 154
      const otherSlot: Timeslot = new Timeslot(58, 15); // slots 58 - 73
      expect(mySlot.conflicts(otherSlot)).toBe(false);
    });
  });

  test("Timeslot.toString", () => {
    const myTimeslot: Timeslot = new Timeslot(151, 5);
    expect(myTimeslot.toString()).toBe("Fri, 1:30 PM – 4:00 PM");
  });

  describe("Timeslot.equals", () => {
    /**
     * Partition:
     * - this.startSlot, other.startSlot: same, different
     * - this.endSlot, other.endSlot: same, different
     */
    test("starSlot same, endSlot same", () => {
      const myTimeslot: Timeslot = new Timeslot(38, 18);
      const otherTimeslot: Timeslot = new Timeslot(38, 18);
      expect(myTimeslot.equals(otherTimeslot)).toBe(true);
    });

    test("startSlot same, endSlot different", () => {
      const myTimeslot: Timeslot = new Timeslot(15, 10);
      const otherTimeslot: Timeslot = new Timeslot(15, 139);
      expect(myTimeslot.equals(otherTimeslot)).toBe(false);
    });

    test("startSlot different, endSlot same", () => {
      const myTimeslot: Timeslot = new Timeslot(61, 46); // NOTE: both end at timeslot 107
      const otherTimeslot: Timeslot = new Timeslot(90, 17);
      expect(myTimeslot.equals(otherTimeslot)).toBe(false);
    });

    test("StartSlot different, endSlot different", () => {
      const myTimeslot: Timeslot = new Timeslot(7, 61);
      const otherTimeslot: Timeslot = new Timeslot(77, 44);
      expect(myTimeslot.equals(otherTimeslot)).toBe(false);
    });
  });
});

test("Event.eventInputs", () => {
  const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT_CONTRAST);
  const myHexCode = "#611917"; // randomly generated hex code
  const myTitle = "y8g0i81"; // random keysmashes
  const myRoom = "ahouttoanhontjanota";
  myCustomActivity.backgroundColor = myHexCode;
  const myEvent: Event = new Event(
    myCustomActivity,
    myTitle,
    [new Timeslot(6, 7), new Timeslot(57, 10)],
    myRoom,
    undefined,
  );
  expect(myEvent.eventInputs).toStrictEqual([
    {
      textColor: "#ffffff",
      title: myTitle,
      start: new Date(2001, 0, 1, 9, 0, 0, 0), // slot 6 = Monday at 9 AM
      end: new Date(2001, 0, 1, 12, 30, 0, 0), // slot 13 = Monday at 12:30 PM
      backgroundColor: myHexCode,
      borderColor: myHexCode,
      room: myRoom,
      activity: myCustomActivity,
    },
    {
      textColor: "#ffffff",
      title: myTitle,
      start: new Date(2001, 0, 2, 17, 30, 0, 0), // slot 57 = Tuesday at 5:30 PM
      end: new Date(2001, 0, 2, 22, 30, 0, 0), // slot 67 = Tuesday at 10:30 PM
      backgroundColor: myHexCode,
      borderColor: myHexCode,
      room: myRoom,
      activity: myCustomActivity,
    },
  ]);
});

describe("CustomActivity", () => {
  describe("CustomActivity.constructor", () => {
    const nanoidRegex = /^[A-Za-z0-9-_]{8}$/;

    test("COLOR_SCHEME_LIGHT", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      expect(nanoidRegex.test(myCustomActivity.id)).toBeTruthy();
      expect(myCustomActivity.backgroundColor).toBe("#4A5568");
    });

    test("COLOR_SCHEME_DARK", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_DARK);
      expect(nanoidRegex.test(myCustomActivity.id)).toBeTruthy();
      expect(myCustomActivity.backgroundColor).toBe("#CBD5E0");
    });

    test("COLOR_SCHEME_LIGHT_CONTRAST", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT_CONTRAST);
      expect(nanoidRegex.test(myCustomActivity.id)).toBeTruthy();
      expect(myCustomActivity.backgroundColor).toBe("#4A5568");
    });

    test("COLOR_SCHEME_DARK_CONTRAST", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_DARK_CONTRAST);
      expect(nanoidRegex.test(myCustomActivity.id)).toBeTruthy();
      expect(myCustomActivity.backgroundColor).toBe("#CBD5E0");
    });
  });

  describe("CustomActivity.buttonName", () => {
    /** Partition on this.name: changed, not changed */
    test("CustomActivity.name not changed", () => {
      expect(new CustomActivity(COLOR_SCHEME_LIGHT).buttonName).toBe("New Activity");
    });

    test("CustomActivity.name changed", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      const myString = "lorem ipsum dolor sit amet";
      myCustomActivity.name = myString;
      expect(myCustomActivity.buttonName).toBe(myString);
    });
  });

  describe("CustomActivity.hours", () => {
    /** Partition on timeslot count: 0, 1, >1 */
    test("0 timeslots", () => {
      expect(new CustomActivity(COLOR_SCHEME_LIGHT).hours).toBe(0);
    });

    test("1 timeslot", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.timeslots = [new Timeslot(4, 5)];
      expect(myCustomActivity.hours).toBe(5 / 2);
    });

    test("multiple timeslots", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.timeslots = [new Timeslot(2, 7), new Timeslot(11, 5)];
      expect(myCustomActivity.hours).toBe(6);
    });
  });

  test("CustomActivity.events", () => {
    // arbitrary random constants
    const myName = "r57t68y9u";
    const myTimeslots: Timeslot[] = [
      new Timeslot(1, 2),
      new Timeslot(5, 7),
      new Timeslot(21, 32),
    ];
    const myRoom = "ahuotiyuwiq";
    // constructing and testing `myCustomActivity`
    const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_DARK);
    myCustomActivity.name = myName;
    myCustomActivity.timeslots = myTimeslots;
    myCustomActivity.room = myRoom;
    expect(myCustomActivity.events).toStrictEqual([
      new Event(myCustomActivity, myName, myTimeslots, myRoom),
    ]);
  });

  describe("CustomActivity.addTimeslot", () => {
    /** Partition:
     * - slot matches existing timeslot, doesn't add
     * - slot extends over multiple days, doesn't add
     * - slot is valid, adds
     */
    test("adds valid slot", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      const myTimeslot: Timeslot = new Timeslot(1, 1);
      myCustomActivity.addTimeslot(myTimeslot);
      expect(myCustomActivity.timeslots).toStrictEqual([myTimeslot]);
    });

    test("doesn't add existing slot", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      const myTimeslot: Timeslot = new Timeslot(4, 6);
      myCustomActivity.timeslots = [myTimeslot];
      myCustomActivity.addTimeslot(myTimeslot);
      expect(myCustomActivity.timeslots).toStrictEqual([myTimeslot]);
    });

    test("doesn't add multi-day slot", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.addTimeslot(new Timeslot(42, 69));
      expect(myCustomActivity.timeslots).toStrictEqual([]);
    });
  });

  describe("CustomActivity.removeTimeslot", () => {
    /**
     * Partition:
     * - CustomActivity.timeslots (before call): empty, nonempty with match, nonempty without match
     */
    test("removing timeslot from empty CustomActivity", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.removeTimeslot(new Timeslot(1, 1));
      expect(myCustomActivity.timeslots).toStrictEqual([]);
    });

    test("remove matching timeslot from nonempty CustomActivity", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      const myTimeslots: Timeslot[] = [
        new Timeslot(1, 2),
        new Timeslot(4, 3),
        new Timeslot(42, 4),
      ];
      myCustomActivity.timeslots = myTimeslots;
      myCustomActivity.removeTimeslot(new Timeslot(1, 2));
      expect(myCustomActivity.timeslots).toStrictEqual([
        new Timeslot(4, 3),
        new Timeslot(42, 4),
      ]);
    });

    test("remove non-matching timeslot from nonempty CustomActivity", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      const myTimeslots: Timeslot[] = [
        new Timeslot(1, 2),
        new Timeslot(4, 3),
        new Timeslot(42, 4),
      ];
      myCustomActivity.timeslots = myTimeslots;
      myCustomActivity.removeTimeslot(new Timeslot(1, 1));
      expect(myCustomActivity.timeslots).toStrictEqual(myTimeslots);
    });
  });

  describe("CustomActivity.deflate", () => {
    /** Partition:
     * - this.timeslots: empty, nonempty
     * - this.room: defined, undefined
     */
    test("timeslots empty, room undefined", () => {
      expect(new CustomActivity(COLOR_SCHEME_LIGHT).deflate()).toStrictEqual([
        [],
        "New Activity",
        "#4A5568",
        "",
      ]);
    });

    test("timeslots empty, room defined", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.room = "lorem ipsum";
      expect(myCustomActivity.deflate()).toStrictEqual([
        [],
        "New Activity",
        "#4A5568",
        "lorem ipsum",
      ]);
    });

    test("timeslots nonempty, room undefined", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.timeslots = [new Timeslot(10, 2)];
      expect(myCustomActivity.deflate()).toStrictEqual([
        [[10, 2]],
        "New Activity",
        "#4A5568",
        "",
      ]);
    });
  });

  describe("CustomActivity.inflate", () => {
    /**
     * Partition on first item: empty, nonempty
     */
    test("first item empty", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.inflate([[], "alpha", "#123456", "beta"]);

      expect(myCustomActivity.timeslots).toStrictEqual([]);
      expect(myCustomActivity.name).toBe("alpha");
      expect(myCustomActivity.backgroundColor).toBe("#123456");
      expect(myCustomActivity.room).toBe("beta");
    });

    test("first item nonempty", () => {
      const myCustomActivity: CustomActivity = new CustomActivity(COLOR_SCHEME_LIGHT);
      myCustomActivity.inflate([
        [
          [1, 2],
          [4, 5],
        ],
        "gamma",
        "#7890AB",
        "delta",
      ]);

      expect(myCustomActivity.timeslots).toStrictEqual([
        new Timeslot(1, 2),
        new Timeslot(4, 5),
      ]);
      expect(myCustomActivity.name).toBe("gamma");
      expect(myCustomActivity.backgroundColor).toBe("#7890AB");
      expect(myCustomActivity.room).toBe("delta");
    });
  });
});
