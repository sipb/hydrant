import assert from "node:assert";
import { describe, test } from "node:test";
import { Timeslot } from "../src/lib/activity.js";
import { Slot } from "../src/lib/dates.js";

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

  // TODO: partition
  await test.skip("Timeslot.conflicts");

  await test("Timeslot.toString", () => {
    const myTimeslot: Timeslot = new Timeslot(151, 5);
    assert.strictEqual(myTimeslot.toString(), "Fri, 1:30 PM – 4:00 PM");
  });

  // TODO: partition
  await test.skip("Timeslot.equals");
});

await test.skip("Event.getEventInputs");

await describe("NonClass", async () => {
  await test.skip("NonClass.constructor");

  await test.skip("NonClass.buttonName");

  await test.skip("NonClass.hours");

  await test.skip("NonClass.events");

  await test.skip("NonClass.addTimeslot");

  await test.skip("NonClass.removeTimeslot");

  await test.skip("NonClass.inflate");

  await test.skip("NonClass.deflate");
});
