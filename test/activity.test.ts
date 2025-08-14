import { assert, test, describe } from 'vitest'
import { Timeslot, NonClass, Event } from "../src/lib/activity";
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
    assert.deepStrictEqual(myTimeslot.startTime, myStart.startDate);
    assert.deepStrictEqual(myTimeslot.endSlot, myEnd);
  });

  test("Timeslot.endSlot", () => {
    const myTimeslot: Timeslot = new Timeslot(131, 4); // numbers generated with the help of an RNG; adjust as needed
    assert.deepStrictEqual(myTimeslot.endSlot, new Slot(135));
  });

  test("Timeslot.startTime", () => {
    const myTimeslot: Timeslot = new Timeslot(22, 43); // note: slot 22 is Monday at 5:00 PM
    assert.deepStrictEqual(
      myTimeslot.startTime,
      new Date(2001, 0, 1, 17, 0, 0, 0),
    );
  });

  test("Timeslot.endTime", () => {
    const myTimeslot: Timeslot = new Timeslot(79, 52); // note: slot 79 + 52 = 131 is Thursday at 8:30 PM
    assert.deepStrictEqual(
      myTimeslot.endTime,
      new Date(2001, 0, 4, 20, 30, 0, 0),
    );
  });

  test("Timeslot.hours", () => {
    const myTimeslot: Timeslot = new Timeslot(9, 14);
    assert.strictEqual(myTimeslot.hours, 7);
  });

  describe("Timeslot.conflicts", () => {
    // PARTITION: all possible orderings of this.startSlot, this.endSlot, other.startSlot, other.endSlot (excluding edge cases)
    // NOTE: all of the timezone start and end points were randomly generated

    test("this.startSlot < this.endSlot < other.startSlot < other.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(18, 115); // slots 18 - 133
      const otherSlot: Timeslot = new Timeslot(135, 21); // slots 135 - 156
      assert.strictEqual(mySlot.conflicts(otherSlot), false);
    });

    test("this.startSlot < other.startSlot < this.endSlot < other.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(73, 27); // slots 73 - 99
      const otherSlot: Timeslot = new Timeslot(80, 36); // slots 80 - 116
      assert.strictEqual(mySlot.conflicts(otherSlot), true);
    });

    test("this.startSlot < other.startSlot < other.endSlot < this.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(36, 125); // slots 36 - 161
      const otherSlot: Timeslot = new Timeslot(120, 19); // slots 120 - 139
      assert.strictEqual(mySlot.conflicts(otherSlot), true);
    });

    test("other.startSlot < this.startSlot < this.endSlot < other.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(37, 11); // slots 37 - 48
      const otherSlot: Timeslot = new Timeslot(35, 121); // slots 35 - 156
      assert.strictEqual(mySlot.conflicts(otherSlot), true);
    });

    test("other.startSlot < this.startSlot < other.endSlot < this.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(118, 55); // slots 118 - 163
      const otherSlot: Timeslot = new Timeslot(73, 69); // slots 73 - 142
      assert.strictEqual(mySlot.conflicts(otherSlot), true);
    });

    test("other.startSlot < other.endSlot < this.startSlot < this.endSlot", () => {
      const mySlot: Timeslot = new Timeslot(112, 42); // slots 112 - 154
      const otherSlot: Timeslot = new Timeslot(58, 15); // slots 58 - 73
      assert.strictEqual(mySlot.conflicts(otherSlot), false);
    });
  });

  test("Timeslot.toString", () => {
    const myTimeslot: Timeslot = new Timeslot(151, 5);
    assert.strictEqual(myTimeslot.toString(), "Fri, 1:30 PM – 4:00 PM");
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
      assert.strictEqual(myTimeslot.equals(otherTimeslot), true);
    });

    test("startSlot same, endSlot different", () => {
      const myTimeslot: Timeslot = new Timeslot(15, 10);
      const otherTimeslot: Timeslot = new Timeslot(15, 139);
      assert.strictEqual(myTimeslot.equals(otherTimeslot), false);
    });

    test("startSlot different, endSlot same", () => {
      const myTimeslot: Timeslot = new Timeslot(61, 46); // NOTE: both end at timeslot 107
      const otherTimeslot: Timeslot = new Timeslot(90, 17);
      assert.strictEqual(myTimeslot.equals(otherTimeslot), false);
    });

    test("StartSlot different, endSlot different", () => {
      const myTimeslot: Timeslot = new Timeslot(7, 61);
      const otherTimeslot: Timeslot = new Timeslot(77, 44);
      assert.strictEqual(myTimeslot.equals(otherTimeslot), false);
    });
  });
});

test("Event.eventInputs", () => {
  const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT_CONTRAST);
  const myHexCode = "#611917"; // randomly generated hex code
  const myTitle = "y8g0i81"; // random keysmashes
  const myRoom = "ahouttoanhontjanota";
  myNonClass.backgroundColor = myHexCode;
  const myEvent: Event = new Event(
    myNonClass,
    myTitle,
    [new Timeslot(6, 7), new Timeslot(57, 10)],
    myRoom,
    undefined,
  );
  assert.deepStrictEqual(myEvent.eventInputs, [
    {
      textColor: "#ffffff",
      title: myTitle,
      start: new Date(2001, 0, 1, 9, 0, 0, 0), // slot 6 = Monday at 9 AM
      end: new Date(2001, 0, 1, 12, 30, 0, 0), // slot 13 = Monday at 12:30 PM
      backgroundColor: myHexCode,
      borderColor: myHexCode,
      room: myRoom,
      activity: myNonClass,
    },
    {
      textColor: "#ffffff",
      title: myTitle,
      start: new Date(2001, 0, 2, 17, 30, 0, 0), // slot 57 = Tuesday at 5:30 PM
      end: new Date(2001, 0, 2, 22, 30, 0, 0), // slot 67 = Tuesday at 10:30 PM
      backgroundColor: myHexCode,
      borderColor: myHexCode,
      room: myRoom,
      activity: myNonClass,
    },
  ]);
});

describe("NonClass", () => {
  describe("NonClass.constructor", () => {
    const nanoidRegex = /^[A-Za-z0-9-_]{8}$/;

    test("COLOR_SCHEME_LIGHT", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#4A5568");
    });

    test("COLOR_SCHEME_DARK", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_DARK);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#CBD5E0");
    });

    test("COLOR_SCHEME_LIGHT_CONTRAST", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT_CONTRAST);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#4A5568");
    });

    test("COLOR_SCHEME_DARK_CONTRAST", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_DARK_CONTRAST);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#CBD5E0");
    });
  });

  describe("NonClass.buttonName", () => {
    /** Partition on this.name: changed, not changed */
    test("NonClass.name not changed", () => {
      assert.strictEqual(
        new NonClass(COLOR_SCHEME_LIGHT).buttonName,
        "New Activity",
      );
    });

    test("NonClass.name changed", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      const myString = "lorem ipsum dolor sit amet";
      myNonClass.name = myString;
      assert.strictEqual(myNonClass.buttonName, myString);
    });
  });

  describe("NonClass.hours", () => {
    /** Partition on timeslot count: 0, 1, >1 */
    test("0 timeslots", () => {
      assert.strictEqual(new NonClass(COLOR_SCHEME_LIGHT).hours, 0);
    });

    test("1 timeslot", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.timeslots = [new Timeslot(4, 5)];
      assert.strictEqual(myNonClass.hours, 5 / 2);
    });

    test("multiple timeslots", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.timeslots = [new Timeslot(2, 7), new Timeslot(11, 5)];
      assert.strictEqual(myNonClass.hours, 6);
    });
  });

  test("NonClass.events", () => {
    // arbitrary random constants
    const myName = "r57t68y9u";
    const myTimeslots: Timeslot[] = [
      new Timeslot(1, 2),
      new Timeslot(5, 7),
      new Timeslot(21, 32),
    ];
    const myRoom = "ahuotiyuwiq";
    // constructing and testing `myNonClass`
    const myNonClass: NonClass = new NonClass(COLOR_SCHEME_DARK);
    myNonClass.name = myName;
    myNonClass.timeslots = myTimeslots;
    myNonClass.room = myRoom;
    assert.deepStrictEqual(myNonClass.events, [
      new Event(myNonClass, myName, myTimeslots, myRoom),
    ]);
  });

  describe("NonClass.addTimeslot", () => {
    /** Partition:
     * - slot matches existing timeslot, doesn't add
     * - slot extends over multiple days, doesn't add
     * - slot is valid, adds
     */
    test("adds valid slot", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      const myTimeslot: Timeslot = new Timeslot(1, 1);
      myNonClass.addTimeslot(myTimeslot);
      assert.deepStrictEqual(myNonClass.timeslots, [myTimeslot]);
    });

    test("doesn't add existing slot", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      const myTimeslot: Timeslot = new Timeslot(4, 6);
      myNonClass.timeslots = [myTimeslot];
      myNonClass.addTimeslot(myTimeslot);
      assert.deepStrictEqual(myNonClass.timeslots, [myTimeslot]);
    });

    test("doesn't add multi-day slot", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.addTimeslot(new Timeslot(42, 69));
      assert.deepStrictEqual(myNonClass.timeslots, []);
    });
  });

  describe("NonClass.removeTimeslot", () => {
    /**
     * Partition:
     * - NonClass.timeslots (before call): empty, nonempty with match, nonempty without match
     */
    test("removing timeslot from empty NonClass", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.removeTimeslot(new Timeslot(1, 1));
      assert.deepStrictEqual(myNonClass.timeslots, []);
    });

    test("remove matching timeslot from nonempty NonClass", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      const myTimeslots: Timeslot[] = [
        new Timeslot(1, 2),
        new Timeslot(4, 3),
        new Timeslot(42, 4),
      ];
      myNonClass.timeslots = myTimeslots;
      myNonClass.removeTimeslot(new Timeslot(1, 2));
      assert.deepStrictEqual(myNonClass.timeslots, [
        new Timeslot(4, 3),
        new Timeslot(42, 4),
      ]);
    });

    test("remove non-matching timeslot from nonempty NonClass", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      const myTimeslots: Timeslot[] = [
        new Timeslot(1, 2),
        new Timeslot(4, 3),
        new Timeslot(42, 4),
      ];
      myNonClass.timeslots = myTimeslots;
      myNonClass.removeTimeslot(new Timeslot(1, 1));
      assert.deepStrictEqual(myNonClass.timeslots, myTimeslots);
    });
  });

  describe("NonClass.deflate", () => {
    /** Partition:
     * - this.timeslots: empty, nonempty
     * - this.room: defined, undefined
     */
    test("timeslots empty, room undefined", () => {
      assert.deepStrictEqual(new NonClass(COLOR_SCHEME_LIGHT).deflate(), [
        [],
        "New Activity",
        "#4A5568",
        "",
      ]);
    });

    test("timeslots empty, room defined", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.room = "lorem ipsum";
      assert.deepStrictEqual(myNonClass.deflate(), [
        [],
        "New Activity",
        "#4A5568",
        "lorem ipsum",
      ]);
    });

    test("timeslots nonempty, room undefined", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.timeslots = [new Timeslot(10, 2)];
      assert.deepStrictEqual(myNonClass.deflate(), [
        [[10, 2]],
        "New Activity",
        "#4A5568",
        "",
      ]);
    });
  });

  describe("NonClass.inflate", () => {
    /**
     * Partition on first item: empty, nonempty
     */
    test("first item empty", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.inflate([[], "alpha", "#123456", "beta"]);

      assert.deepStrictEqual(myNonClass.timeslots, []);
      assert.strictEqual(myNonClass.name, "alpha");
      assert.strictEqual(myNonClass.backgroundColor, "#123456");
      assert.strictEqual(myNonClass.room, "beta");
    });

    test("first item nonempty", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      myNonClass.inflate([
        [
          [1, 2],
          [4, 5],
        ],
        "gamma",
        "#7890AB",
        "delta",
      ]);

      assert.deepStrictEqual(myNonClass.timeslots, [
        new Timeslot(1, 2),
        new Timeslot(4, 5),
      ]);
      assert.strictEqual(myNonClass.name, "gamma");
      assert.strictEqual(myNonClass.backgroundColor, "#7890AB");
      assert.strictEqual(myNonClass.room, "delta");
    });
  });
});
