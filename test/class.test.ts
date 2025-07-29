import { describe, test } from "node:test";

// TODO
await describe("Sections", async () => {
  await test.skip("Sections.shortName");

  await test.skip("Sections.name");

  await test.skip("Sections.event");

  await test.skip("Sections.lockSection");
});

await describe("Section", async () => {

  await test("Section.constructor", () => {
  });

  await test.skip("Section.parsedTime");

  await test.skip("Section.countConflicts");
});

await describe("Class", async () => {
  await test.skip("Class.id");

  await test.skip("Class.name");

  await test.skip("Class.buttonName");

  await test.skip("Class.number");

  await test.skip("Class.oldNumber");

  await test.skip("Class.course");

  await test.skip("Class.units");

  await test.skip("Class.isVariableUnits");

  await test.skip("Class.totalUnits");

  await test.skip("Class.hours");

  await test.skip("Class.half");

  await test.skip("Class.events");

  await test.skip("Class.flags");

  await test.skip("Class.cim");

  await test.skip("Class.evals");

  await test.skip("Class.related");

  await test.skip("Class.warnings");

  await test.skip("Class.description");

  await test.skip("Class.deflate");

  await test.skip("Class.inflate");
});
