import { describe, test } from "node:test";

await describe("Timeslot", async () => {
  await test.skip("Timeslot.fromStartEnd");

  await test.skip("Timeslot.endSlot");

  await test.skip("Timeslot.startTime");

  await test.skip("Timeslot.endTime");

  await test.skip("Timeslot.hours");

  await test.skip("Timeslot.conflicts");

  await test.skip("Timeslot.toString");

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
