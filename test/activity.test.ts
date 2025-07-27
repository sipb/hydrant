import assert from "node:assert";
import { describe, test } from "node:test";
import { Timeslot, NonClass } from "../src/lib/activity.js";
import { Slot } from "../src/lib/dates.js";
import {
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT_CONTRAST,
  COLOR_SCHEME_DARK_CONTRAST,
} from "../src/lib/colors.js";

await describe("Timeslot", async () => {
  await test.skip("Timeslot.fromStartEnd", () => {
    const myStart: Slot = new Slot(2);
    const myEnd: Slot = new Slot(120);
    const myTimeslot: Timeslot = Timeslot.fromStartEnd(myStart, myEnd);
    assert.deepStrictEqual(myTimeslot.startTime, myStart.startDate);
    assert.deepStrictEqual(myTimeslot.endSlot, myEnd);
  });

  await test("Timeslot.endSlot", () => {
    const myTimeslot: Timeslot = new Timeslot(131, 4); // numbers generated with the help of an RNG; adjust as needed
    assert.deepStrictEqual(myTimeslot.endSlot, new Slot(135));
  });

  await test("Timeslot.startTime", () => {
    const myTimeslot: Timeslot = new Timeslot(22, 43); // note: slot 22 is Monday at 5:00 PM
    assert.deepStrictEqual(
      myTimeslot.startTime,
      new Date(2001, 0, 1, 17, 0, 0, 0),
    );
  });

  await test("Timeslot.endTime", () => {
    const myTimeslot: Timeslot = new Timeslot(79, 52); // note: slot 79 + 52 = 131 is Thursday at 8:30 PM
    assert.deepStrictEqual(
      myTimeslot.endTime,
      new Date(2001, 0, 4, 20, 30, 0, 0),
    );
  });

  await test("Timeslot.hours", () => {
    const myTimeslot: Timeslot = new Timeslot(9, 14);
    assert.strictEqual(myTimeslot.hours, 7);
  });

  await test.skip("Timeslot.conflict");

  await test("Timeslot.toString", () => {
    const myTimeslot: Timeslot = new Timeslot(151, 5);
    assert.strictEqual(myTimeslot.toString(), "Fri, 1:30 PM – 4:00 PM");
  });

  await describe("Timeslot.equals", async () => {
    /**
     * Partition:
     * - this.startSlot, other.startSlot: same, different
     * - this.endSlot, other.endSlot: same, different
     */
    await test("starSlot same, endSlot same", () => {
      const myTimeslot: Timeslot = new Timeslot(38, 18);
      const otherTimeslot: Timeslot = new Timeslot(38, 18);
      assert.strictEqual(myTimeslot.equals(otherTimeslot), true);
    });

    await test("startSlot same, endSlot different", () => {
      const myTimeslot: Timeslot = new Timeslot(15, 10);
      const otherTimeslot: Timeslot = new Timeslot(15, 139);
      assert.strictEqual(myTimeslot.equals(otherTimeslot), false);
    });

    await test("startSlot different, endSlot same", () => {
      const myTimeslot: Timeslot = new Timeslot(61, 46); // NOTE: both end at timeslot 107
      const otherTimeslot: Timeslot = new Timeslot(90, 17);
      assert.strictEqual(myTimeslot.equals(otherTimeslot), false);
    });

    await test("StartSlot different, endSlot different", () => {
      const myTimeslot: Timeslot = new Timeslot(7, 61);
      const otherTimeslot: Timeslot = new Timeslot(77, 44);
      assert.strictEqual(myTimeslot.equals(otherTimeslot), false);
    });
  });
});

await test.skip("Event.getEventInputs");

await describe("NonClass", async () => {
  await describe("NonClass.constructor", async () => {
    const nanoidRegex = /^[A-Za-z0-9-_]{8}$/;

    await test("COLOR_SCHEME_LIGHT", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#4A5568");
    });

    await test("COLOR_SCHEME_DARK", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_DARK);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#CBD5E0");
    });

    await test("COLOR_SCHEME_LIGHT_CONTRAST", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_LIGHT_CONTRAST);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#4A5568");
    });

    await test("COLOR_SCHEME_DARK_CONTRAST", () => {
      const myNonClass: NonClass = new NonClass(COLOR_SCHEME_DARK_CONTRAST);
      assert.ok(nanoidRegex.test(myNonClass.id));
      assert.strictEqual(myNonClass.backgroundColor, "#CBD5E0");
    });
  });

  await test.skip("NonClass.buttonName");

  await test.skip("NonClass.hours");

  await test.skip("NonClass.events");

  await test.skip("NonClass.addTimeslot");

  await test.skip("NonClass.removeTimeslot");

  await test.skip("NonClass.inflate");

  await test.skip("NonClass.deflate");
});
