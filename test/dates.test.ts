import assert from "node:assert";
import { describe, test } from "node:test";
import jsdomGlobal from "jsdom-global";
import {
  parseUrlName,
  getClosestUrlName,
  getUrlNames,
  toFullUrl,
  Slot,
  Term,
} from "../src/lib/dates.js";

await test("parseUrlName", () => {
  assert.deepStrictEqual(parseUrlName("f22"), {
    year: "22",
    semester: "f",
  });
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

  await test("getUrlNames(latestUrlName) includes urlName", () => {
    assert.deepStrictEqual(getClosestUrlName("f24", "i25"), {
      urlName: "f24",
      shouldWarn: false,
    });
  });

  await test("EXCLUDED_URLS includes urlName, urlName includes nextUrlName", () => {
    assert.deepStrictEqual(getClosestUrlName("m23", "f23"), {
      urlName: "f23",
      shouldWarn: false,
    });
  });

  await test("unrecognized term", () => {
    assert.deepStrictEqual(getClosestUrlName("ipsum", "m25"), {
      urlName: "i25",
      shouldWarn: true,
    });
  });

  await test("fallback to latest term", () => {
    assert.deepStrictEqual(getClosestUrlName("lorem", "m25"), {
      urlName: "m25",
      shouldWarn: true,
    });
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
    assert.deepStrictEqual(myTerm.start, new Date(2042, 3, 20, 0));
    assert.deepStrictEqual(myTerm.h1End, new Date(2042, 3, 21, 0));
    assert.deepStrictEqual(myTerm.h2Start, new Date(2042, 3, 22, 0));
    assert.deepStrictEqual(myTerm.mondaySchedule, new Date(2042, 3, 23, 0));
    assert.deepStrictEqual(myTerm.holidays, [new Date(2042, 3, 24, 0)]);
    assert.deepStrictEqual(myTerm.end, new Date(2042, 3, 25, 0));
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

  await describe("Term.startDateFor", async () => {
    /**
     * Partition:
     * - secondHalf: false, true
     * - startDay: undefined, defined
     * - slot.weekday: same as start day, different from start day
     */

    // declare this arbitrary constant once and for all to make code DRYer
    const myTerm: Term = new Term({
      urlName: "f44", // arbitrary values
      startDate: "2044-10-19", // NOTE: this is a Wednesday
      h2StartDate: "2044-11-21", // NOTE: this is a Monday
    });

    await test("secondHalf false, startDay undefined, slot.weekday matches", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(69), // Wednesday, slot 1 (= 6:30 AM)
          false,
          undefined,
        ),
        new Date(2044, 9, 19, 6, 30),
      );
    });

    await test("secondHalf false, startDay undefined, slot.weekday doesn't match", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(61), // Tuesday, slot 27 (= 7:30 PM)
          false,
          undefined,
        ),
        new Date(2044, 9, 25, 19, 30), // bump to next Tuesday, October 25, 2044
      );
    });

    await test("secondHalf false, startDay defined, slot.weekday matches", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(168), // Friday, slot 32 (= 10:00 PM)
          false,
          [11, 4], // this would mean Friday, November 4, 2044
        ),
        new Date(2044, 10, 4, 22),
      );
    });

    await test("secondHalf false, startDay defined, slot.weekday doesn't match", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(28), // Monday, slot 28 (= 8:00 PM)
          false,
          [11, 4],
        ),
        new Date(2044, 10, 7, 20), // bumps to next Monday, November 7, 2044
      );
    });

    await test("secondHalf true, startDay undefined, slot.weekday matches", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(1), // Monday, slot 1 (= 6:30 AM)
          true,
          undefined,
        ),
        new Date(2044, 10, 21, 6, 30),
      );
    });

    await test("secondHalf true, startDay undefined, slot.weekday doesn't match", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(35), // Tuesday, slot 1 (= 6:30 AM)
          true,
          undefined,
        ),
        new Date(2044, 10, 22, 6, 30), // bump to next day
      );
    });

    await test("secondHalf true, startDay defined, slot.weekday matches", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(1), // Monday, slot 1 (= 6:30 AM)
          true,
          [11, 14], // Monday, November 14, 2044
        ),
        new Date(2044, 10, 14, 6, 30),
      );
    });

    await test("secondHalf true, startDay defined, slot.weekday doesn't match", () => {
      assert.deepStrictEqual(
        myTerm.startDateFor(
          new Slot(35), // Tuesday, slot 1 (= 6:30 AM)
          true,
          [11, 14],
        ),
        new Date(2044, 10, 15, 6, 30), // bump to next day
      );
    });
  });

  await describe("Term.endDateFor", async () => {
    /**
     * Partition:
     * - firstHalf: false, true
     * - endDay: undefined, defined
     * - slot.weekday: same as end day, different from end day
     *
     * TODO
     */
    const myTerm: Term = new Term({
      urlName: "f44",
      h1EndDate: "2044-10-19", // NOTE: this is a Wednesday
      endDate: "2044-11-21", // NOTE: this is a Monday
    });

    await test("firstHalf false, endDay undefined, slot.weekday matches", () => {
      assert.deepStrictEqual(
        myTerm.endDateFor(new Slot(1), false, undefined), // NOTE: slot 1 = Monday at 6:30 AM
        new Date(2044, 10, 22, 6, 30, 0, 0),
      );
    });

    await test("firstHalf false, endDay undefined, slot.weekday doesn't match", () => {
      assert.deepStrictEqual(
        myTerm.endDateFor(new Slot(68), false, undefined), // NOTE: slot 68 = Wednesday at 6:00 AM
        new Date(2044, 10, 17, 6, 0, 0, 0), // NOTE: 2044-11-17 is a Thursday
      );
    });

    await test("firstHalf true, endDay undefined, slot.weekday matches", () => {
      assert.deepStrictEqual(
        myTerm.endDateFor(new Slot(94), true, undefined), // NOTE: slot 94 = Wednesday at 7:00 PM
        new Date(2044, 9, 20, 19, 0, 0, 0),
      );
    });

    await test("firstHalf true, endDay undefined, slot.weekday doesn't match", () => {
      assert.deepStrictEqual(
        myTerm.endDateFor(new Slot(4), true, undefined), // NOTE: slot 4 = Monday at 8:00 PM
        new Date(2044, 9, 18, 8, 0, 0, 0), // NOTE: 2044-10-18 is a Tuesday
      );
    });

    await test.skip("firstHalf false, endDay defined, slot.weekday matches");

    await test.skip(
      "firstHalf false, endDay defined, slot.weekday doesn't match",
    );

    await test.skip("firstHalf true, endDay defined, slot.weekday matches");

    await test.skip(
      "firstHalf true, endDay defined, slot.weekday doesn't match",
    );
  });

  await describe("Term.exDatesFor", async () => {
    /**
     * Partition:
     * - has matching holiday, has non-matching holiday, has no holiday
     * - includes tuesday for monday schedule, doesn't include it
     *
     * TODO
     */
    await test("has matching holiday, tuesday on monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-08"], // NOTE: 2079-08-08 is a Tuesday
        mondayScheduleDate: "2079-08-11",
      });
      assert.deepStrictEqual(
        myTerm.exDatesFor(new Slot(40)), // NOTE: slot 40 = Tuesday at 9:00 AM
        [
          new Date(2079, 7, 8, 9, 0, 0, 0),
          new Date(1999, 11, 31, 9, 0, 0, 0),
          new Date(2079, 7, 11, 9, 0, 0, 0),
        ],
      );
    });

    await test("has matching holiday, not monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-09"], // NOTE: 2079-08-09 is a Wednesday
        mondayScheduleDate: "2079-08-11",
      });
      assert.deepStrictEqual(
        myTerm.exDatesFor(new Slot(100)), // NOTE: slot 100 = Wednesday at 10:00 PM
        [
          new Date(2079, 7, 9, 22, 0, 0, 0),
          new Date(1999, 11, 31, 22, 0, 0, 0),
        ],
      );
    });

    await test("has non-matching holiday, tuesday on monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-20"], // NOTE: 2079-08-20 is a Sunday
        mondayScheduleDate: "2079-08-11",
      });
      assert.deepStrictEqual(
        myTerm.exDatesFor(new Slot(41)), // NOTE: slot 41 = Tuesday at 9:30 AM
        [
          new Date(1999, 11, 31, 9, 30, 0, 0),
          new Date(2079, 7, 11, 9, 30, 0, 0),
        ],
      );
    });

    await test("has non-matching holiday, not monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-14"], // NOTE: 2079-08-14 is a Monday
        mondayScheduleDate: "2079-08-11",
      });
      assert.deepStrictEqual(
        myTerm.exDatesFor(new Slot(168)), // NOTE: slot 100 = Friday at 10:00 PM
        [new Date(1999, 11, 31, 22, 0, 0, 0)],
      );
    });

    await test("no holidays, tuesday for monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "f79",
        mondayScheduleDate: "2079-01-01",
      });
      assert.deepStrictEqual(
        myTerm.exDatesFor(new Slot(34)), // NOTE: slot 34 = Tuesday at 6:00 AM
        [new Date(1999, 11, 31, 6, 0, 0, 0), new Date(2079, 0, 1, 6, 0, 0, 0)], // NOTE: in some timezones this shifts to 2000-01-01 so we hardcode "America/New_York" for reproducibility
      );
    });

    await test("no holidays, not monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "f79",
        mondayScheduleDate: undefined,
      });
      assert.deepStrictEqual(myTerm.exDatesFor(new Slot(34)), [
        new Date(1999, 11, 31, 6, 0, 0, 0),
      ]);
    });
  });

  await describe("Term.rDateFor", async () => {
    /**
     * Partition:
     * - slot.weekday: 1, not 1
     * - this.mondaySchedule: defined undefined
     *
     * TODO
     */
    await test("slot.weekday Monday, this.mondaySchedule defined", () => {
      const myTerm: Term = new Term({
        urlName: "f56",
        mondayScheduleDate: "2056-04-24",
      });
      assert.deepStrictEqual(
        myTerm.rDateFor(new Slot(0)),
        new Date(2056, 3, 24, 6, 0, 0, 0),
      );
    });

    await test("slot.weekday not Monday, this.mondaySchedule defined", () => {
      const myTerm: Term = new Term({
        urlName: "f56",
        mondayScheduleDate: "2056-04-24",
      });
      assert.deepStrictEqual(myTerm.rDateFor(new Slot(157)), undefined);
    });

    await test("slot.weekday Monday, this.mondaySchedule undefined", () => {
      const myTerm: Term = new Term({ urlName: "s51" });
      assert.deepStrictEqual(myTerm.rDateFor(new Slot(6)), undefined);
    });

    await test("slot.weekday not Monday, this.mondaySchedule undefined", () => {
      const myTerm: Term = new Term({ urlName: "s51" });
      assert.deepStrictEqual(myTerm.rDateFor(new Slot(118)), undefined);
    });
  });
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

await describe("getUrlNames", async () => {
  /**
   * Partition on urlName:
   * - EARLIEST_URL
   * - between EARLIEST_URL and excluded urls
   * - an excluded url
   * - after excluded urls
   */
  await test("urlName === EARLIEST_URL", () => {
    assert.deepStrictEqual(getUrlNames("f22"), ["f22"]);
  });

  await test("urlName is before excluded urls", () => {
    assert.deepStrictEqual(getUrlNames("i23"), ["i23", "f22"]);
  });

  await test("urlName is excluded", () => {
    assert.deepStrictEqual(getUrlNames("m23"), ["m23", "s23", "f22"]);
  });

  await test("urlName is after excluded urls", () => {
    assert.deepStrictEqual(getUrlNames("i25"), [
      "i25",
      "f24",
      "s24",
      "f23",
      "s23",
      "f22",
    ]);
  });
});

await describe("toFullUrl", async () => {
  /**
   * Partition:
   * - window.location.href: has parameters, has no parameters
   * - urlName, latestUrlName: same, different
   */
  await test("window.location.href has parameters, urlName = latestUrlName", () => {
    const myUrl = "https://example.com/?utm_source=lorem&utm_medium=ipsum";
    const cleanup = jsdomGlobal("", { url: myUrl });
    assert.strictEqual(window.location.href, myUrl);
    assert.strictEqual(toFullUrl("lorem", "lorem"), "https://example.com/");
    cleanup();
  });

  await test("window.location.href has no parameters, urlName = latestUrlName", () => {
    const myUrl = "https://example.com/";
    const cleanup = jsdomGlobal("", { url: myUrl });
    assert.strictEqual(window.location.href, myUrl);
    assert.strictEqual(toFullUrl("lorem", "lorem"), "https://example.com/");
    cleanup();
  });

  await test("window.location.href has parameters, urlName = latestUrlName", () => {
    const myUrl = "https://example.com/?utm_source=lorem&utm_medium=ipsum";
    const cleanup = jsdomGlobal("", { url: myUrl });
    assert.strictEqual(window.location.href, myUrl);
    assert.strictEqual(
      toFullUrl("lorem", "ipsum"),
      "https://example.com/?t=lorem",
    );
    cleanup();
  });

  await test("window.location.href has no parameters, urlName = latestUrlName", () => {
    const myUrl = "https://example.com/";
    const cleanup = jsdomGlobal("", { url: myUrl });
    assert.strictEqual(window.location.href, myUrl);
    assert.strictEqual(
      toFullUrl("lorem", "ipsum"),
      "https://example.com/?t=lorem",
    );
    cleanup();
  });
});
