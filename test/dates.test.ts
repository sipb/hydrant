import assert from "node:assert";
import { describe, test } from "node:test";
import {
  parseUrlName,
  getClosestUrlName,
  Slot,
  Term,
} from "../src/lib/dates.js";

await test("parseUrlName", () => {
  assert.deepStrictEqual(parseUrlName("f22"), {
    year: "22",
    semester: "f",
  });
});

await describe("Term", async () => {
  /**
   * Test each method separately (most of them don't need to be partitioned)
   * TODO
   */
  await test("Term.constructor", () => {
    const myTerm: Term = new Term({
      urlName: "f42", // arbitrary values
      startDate: "2042-04-20",
      h1EndDate: "2042-04-21",
      h2StartDate: "2042-04-22",
      mondayScheduleDate: "2042-04-23",
      holidayDates: ["2042-04-24"],
      endDate: "2042-04-25",
    });
    assert.strictEqual(myTerm.year, "42");
    assert.strictEqual(myTerm.semester, "f");
    assert.deepStrictEqual(myTerm.start, new Date(2042, 3, 20, 0, 0, 0, 0));
    assert.deepStrictEqual(myTerm.h1End, new Date(2042, 3, 21, 0, 0, 0, 0));
    assert.deepStrictEqual(myTerm.h2Start, new Date(2042, 3, 22, 0, 0, 0, 0));
    assert.deepStrictEqual(
      myTerm.mondaySchedule,
      new Date(2042, 3, 23, 0, 0, 0, 0),
    );
    assert.deepStrictEqual(myTerm.holidays, [
      new Date(2042, 3, 24, 0, 0, 0, 0),
    ]);
    assert.deepStrictEqual(myTerm.end, new Date(2042, 3, 25, 0, 0, 0, 0));
  });

  await test("Term.fullRealYear", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    assert.strictEqual(myTerm.fullRealYear, "2069");
  });

  await test("Term.semesterFull", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    assert.strictEqual(myTerm.semesterFull, "iap");
  });

  await test("Term.semesterFullCaps", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    assert.strictEqual(myTerm.semesterFullCaps, "IAP");
  });

  await test("Term.niceName", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    assert.strictEqual(myTerm.niceName, "IAP 2069");
  });

  await test("Term.urlName", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    assert.strictEqual(myTerm.urlName, "i69");
  });

  await test("Term.toString", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    assert.strictEqual(myTerm.toString(), "i69");
  });

  await test.skip("Term.startDateFor");

  await test.skip("Term.endDateFor");

  await test.skip("Term.exDatesFor");

  await test.skip("Term.rDateFor");
});

await describe("Slot", async () => {
  /**
   * Test each method separately (most of them don't need to be partitioned)
   * TODO
   */
  await test("Slot.fromSlotNumber", () => {
    const mySlot: Slot = Slot.fromSlotNumber(42);
    assert.strictEqual(mySlot.slot, 42);
  });

  await test("Slot.fromStartDate", () => {
    const myDate: Date = new Date(2001, 6, 19, 22, 1, 52, 23); // randomly chosen date
    const mySlot: Slot = Slot.fromStartDate(myDate);
    assert.strictEqual(mySlot.slot, 134); // note: this was a Thursday (July 19, 2001), slot number 32
  });

  await test("Slot.fromDayString", () => {
    const mySlot: Slot = Slot.fromDayString("Thu", "10:00 PM");
    assert.strictEqual(mySlot.slot, 134);
  });

  await test("Slot.add", () => {
    const mySlot: Slot = new Slot(125);
    const myOtherSlot: Slot = mySlot.add(-111);
    assert.strictEqual(myOtherSlot.slot, 14);
  });

  await test("Slot.onDate", () => {
    const mySlot: Slot = new Slot(125); // Thursday, 5:30 PM
    const myDate: Date = new Date(2068, 8, 6); // this is also a Thursday
    assert.deepStrictEqual(mySlot.onDate(myDate), new Date(2068, 8, 6, 17, 30));
  });

  await test("Slot.startDate", () => {
    const mySlot: Slot = new Slot(62); // Tuesday, 8:00 PM
    assert.deepStrictEqual(mySlot.startDate, new Date(2001, 0, 2, 20, 0));
  });

  await test("Slot.endDate", () => {
    const mySlot: Slot = new Slot(130); // Thursday, 8:00 PM
    assert.deepStrictEqual(mySlot.endDate, new Date(2001, 0, 4, 20, 30));
  });

  await test("Slot.weekday", () => {
    const mySlot: Slot = new Slot(18); // Monday, 3:00 PM
    assert.strictEqual(mySlot.weekday, 1);
  });

  await test("Slot.dayString", () => {
    const mySlot: Slot = new Slot(12); // Monday, 12:00 PM
    assert.strictEqual(mySlot.dayString, "Mon");
  });

  await test("Slot.timeString", () => {
    const mySlot: Slot = new Slot(31); // Monday, 9:30 PM
    assert.strictEqual(mySlot.timeString, "9:30 PM");
  });
});

// TODO: figure out how to mock `window.location.href` for these tests
await describe("toFullUrl", async () => {
  /**
   * Partition:
   * - window.location.href: has parameters, has no parameters
   * - urlName, latestUrlName: same, different
   */
  await test.skip(
    "window.location.href has parameters, urlName = latestUrlName",
  );

  await test.skip(
    "window.location.href has no parameters, urlName = latestUrlName",
  );

  await test.skip(
    "window.location.href has parameters, urlName != latestUrlName",
  );

  await test.skip(
    "window.location.href has no parameters, urlName != latestUrlName",
  );
});

await describe("getUrlNames", async () => {
  /**
   * Partition on urlName:
   * - EARLIEST_URL
   * - between EARLIEST_URL and excluded urls
   * - an excluded url
   * - after excluded urls
   */
  await test.skip("urlName === EARLIEST_URL");

  await test.skip("urlName is before excluded urls");

  await test.skip("urlName is excluded");

  await test.skip("urlName is after excluded urls");
});

await describe("getClosestUrlName", async () => {
  /**
   * Partition:
   * - urlName is null
   * - urlName is empty string
   * - urlName is equal to "latest"
   * - getUrlNames(latestUrlName) includes urlName
   * - EXCLUDED_URLS includes urlName, urlName includes nextUrlName
   * - unrecognized term
   * - fallback to latest term
   */
  await test("urlName is null", () => {
    assert.deepStrictEqual(getClosestUrlName(null, "f22"), {
      urlName: "f22",
      shouldWarn: false,
    });
  });

  await test("urlName is empty string", () => {
    assert.deepStrictEqual(getClosestUrlName("", "f22"), {
      urlName: "f22",
      shouldWarn: false,
    });
  });

  await test('urlName is equal to "latest"', () => {
    assert.deepStrictEqual(getClosestUrlName("latest", "f22"), {
      urlName: "f22",
      shouldWarn: false,
    });
  });

  // TODO: implement these (and possibly a better partition for this?)
  await test.skip("getUrlNames(latestUrlName) includes urlName");

  await test.skip(
    "EXCLUDED_URLS includes urlName, urlName includes nextUrlName",
  );

  await test.skip("unrecognized term");

  await test.skip("fallback to latest term");
});
