import { test, describe, beforeEach, expect } from "vitest";
import {
  parseUrlName,
  getClosestUrlName,
  getUrlNames,
  toFullUrl,
  Slot,
  Term,
} from "../src/lib/dates";
import { JSDOM } from "jsdom";

test("parseUrlName", () => {
  expect(parseUrlName("f22")).toStrictEqual({
    year: "22",
    semester: "f",
  });
});

describe("getClosestUrlName", () => {
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
  test("urlName is null", () => {
    expect(getClosestUrlName(null, "f22")).toStrictEqual({
      urlName: "f22",
      shouldWarn: false,
    });
  });

  test("urlName is empty string", () => {
    expect(getClosestUrlName("", "f22")).toStrictEqual({
      urlName: "f22",
      shouldWarn: false,
    });
  });

  test('urlName is equal to "latest"', () => {
    expect(getClosestUrlName("latest", "f22")).toStrictEqual({
      urlName: "f22",
      shouldWarn: false,
    });
  });

  test("getUrlNames(latestUrlName) includes urlName", () => {
    expect(getClosestUrlName("f24", "i25")).toStrictEqual({
      urlName: "f24",
      shouldWarn: false,
    });
  });

  test("EXCLUDED_URLS includes urlName, urlName includes nextUrlName", () => {
    expect(getClosestUrlName("m23", "f23")).toStrictEqual({
      urlName: "f23",
      shouldWarn: false,
    });
  });

  test("unrecognized term", () => {
    expect(getClosestUrlName("ipsum", "m25")).toStrictEqual({
      urlName: "i25",
      shouldWarn: true,
    });
  });

  test("fallback to latest term", () => {
    expect(getClosestUrlName("lorem", "m25")).toStrictEqual({
      urlName: "m25",
      shouldWarn: true,
    });
  });
});

describe("Term", () => {
  /**
   * Test each method separately (most of them don't need to be partitioned)
   */
  test("Term.constructor", () => {
    const myTerm: Term = new Term({
      urlName: "f42", // arbitrary values
      startDate: "2042-04-20",
      h1EndDate: "2042-04-21",
      h2StartDate: "2042-04-22",
      mondayScheduleDate: "2042-04-23",
      holidayDates: ["2042-04-24"],
      endDate: "2042-04-25",
    });
    expect(myTerm.year).toBe("42");
    expect(myTerm.semester).toBe("f");
    expect(myTerm.start).toStrictEqual(new Date(2042, 3, 20, 0));
    expect(myTerm.h1End).toStrictEqual(new Date(2042, 3, 21, 0));
    expect(myTerm.h2Start).toStrictEqual(new Date(2042, 3, 22, 0));
    expect(myTerm.mondaySchedule).toStrictEqual(new Date(2042, 3, 23, 0));
    expect(myTerm.holidays).toStrictEqual([new Date(2042, 3, 24, 0)]);
    expect(myTerm.end).toStrictEqual(new Date(2042, 3, 25, 0));
  });

  test("Term.fullRealYear", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    expect(myTerm.fullRealYear).toBe("2069");
  });

  test("Term.semesterFull", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    expect(myTerm.semesterFull).toBe("iap");
  });

  test("Term.semesterFullCaps", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    expect(myTerm.semesterFullCaps).toBe("IAP");
  });

  test("Term.niceName", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    expect(myTerm.niceName).toBe("IAP 2069");
  });

  test("Term.urlName", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    expect(myTerm.urlName).toBe("i69");
  });

  test("Term.toString", () => {
    const myTerm: Term = new Term({ urlName: "i69" });
    expect(myTerm.toString()).toBe("i69");
  });

  describe("Term.startDateFor", () => {
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

    test("secondHalf false, startDay undefined, slot.weekday matches", () => {
      expect(
        myTerm.startDateFor(
          new Slot(69), // Wednesday, slot 1 (= 6:30 AM)
          false,
          undefined,
        ),
      ).toStrictEqual(new Date(2044, 9, 19, 6, 30));
    });

    test("secondHalf false, startDay undefined, slot.weekday doesn't match", () => {
      expect(
        myTerm.startDateFor(
          new Slot(61), // Tuesday, slot 27 (= 7:30 PM)
          false,
          undefined,
        ),
      ).toStrictEqual(
        new Date(2044, 9, 25, 19, 30), // bump to next Tuesday, October 25, 2044
      );
    });

    test("secondHalf false, startDay defined, slot.weekday matches", () => {
      expect(
        myTerm.startDateFor(
          new Slot(168), // Friday, slot 32 (= 10:00 PM)
          false,
          [11, 4], // this would mean Friday, November 4, 2044
        ),
      ).toStrictEqual(new Date(2044, 10, 4, 22));
    });

    test("secondHalf false, startDay defined, slot.weekday doesn't match", () => {
      expect(
        myTerm.startDateFor(
          new Slot(28), // Monday, slot 28 (= 8:00 PM)
          false,
          [11, 4],
        ),
      ).toStrictEqual(
        new Date(2044, 10, 7, 20), // bumps to next Monday, November 7, 2044
      );
    });

    test("secondHalf true, startDay undefined, slot.weekday matches", () => {
      expect(
        myTerm.startDateFor(
          new Slot(1), // Monday, slot 1 (= 6:30 AM)
          true,
          undefined,
        ),
      ).toStrictEqual(new Date(2044, 10, 21, 6, 30));
    });

    test("secondHalf true, startDay undefined, slot.weekday doesn't match", () => {
      expect(
        myTerm.startDateFor(
          new Slot(35), // Tuesday, slot 1 (= 6:30 AM)
          true,
          undefined,
        ),
      ).toStrictEqual(
        new Date(2044, 10, 22, 6, 30), // bump to next day
      );
    });

    test("secondHalf true, startDay defined, slot.weekday matches", () => {
      expect(
        myTerm.startDateFor(
          new Slot(1), // Monday, slot 1 (= 6:30 AM)
          true,
          [11, 14], // Monday, November 14, 2044
        ),
      ).toStrictEqual(new Date(2044, 10, 14, 6, 30));
    });

    test("secondHalf true, startDay defined, slot.weekday doesn't match", () => {
      expect(
        myTerm.startDateFor(
          new Slot(35), // Tuesday, slot 1 (= 6:30 AM)
          true,
          [11, 14],
        ),
      ).toStrictEqual(
        new Date(2044, 10, 15, 6, 30), // bump to next day
      );
    });
  });

  describe("Term.endDateFor", () => {
    /**
     * Partition:
     * - firstHalf: false, true
     * - endDay: undefined, defined
     * - slot.weekday: same as end day, different from end day
     */
    const myTerm: Term = new Term({
      urlName: "f44",
      h1EndDate: "2044-10-19", // NOTE: this is a Wednesday
      endDate: "2044-11-21", // NOTE: this is a Monday
    });

    test("firstHalf false, endDay undefined, slot.weekday matches", () => {
      expect(
        myTerm.endDateFor(new Slot(1), false, undefined), // NOTE: slot 1 = Monday at 6:30 AM
      ).toStrictEqual(new Date(2044, 10, 22, 6, 30, 0, 0));
    });

    test("firstHalf false, endDay undefined, slot.weekday doesn't match", () => {
      expect(
        myTerm.endDateFor(new Slot(68), false, undefined), // NOTE: slot 68 = Wednesday at 6:00 AM
      ).toStrictEqual(
        new Date(2044, 10, 17, 6, 0, 0, 0), // NOTE: 2044-11-17 is a Thursday
      );
    });

    test("firstHalf true, endDay undefined, slot.weekday matches", () => {
      expect(
        myTerm.endDateFor(new Slot(94), true, undefined), // NOTE: slot 94 = Wednesday at 7:00 PM
      ).toStrictEqual(new Date(2044, 9, 20, 19, 0, 0, 0));
    });

    test("firstHalf true, endDay undefined, slot.weekday doesn't match", () => {
      expect(
        myTerm.endDateFor(new Slot(4), true, undefined), // NOTE: slot 4 = Monday at 8:00 PM
      ).toStrictEqual(
        new Date(2044, 9, 18, 8, 0, 0, 0), // NOTE: 2044-10-18 is a Tuesday
      );
    });

    test("firstHalf false, endDay defined, slot.weekday matches", () => {
      expect(
        myTerm.endDateFor(new Slot(0), false, [9, 5]), // NOTE: 2044-09-05 is a Monday
      ).toStrictEqual(new Date(2044, 8, 6, 6, 0, 0, 0));
    });

    test("firstHalf true, endDay defined, slot.weekday matches", () => {
      expect(myTerm.endDateFor(new Slot(0), true, [9, 5])).toStrictEqual(
        new Date(2044, 8, 6, 6, 0, 0, 0),
      );
    });

    test("firstHalf false, endDay defined, slot.weekday doesn't match", () => {
      expect(
        myTerm.endDateFor(new Slot(69), false, [9, 5]), // NOTE: slot 69 = Wednesday at 6:30 AM
      ).toStrictEqual(new Date(2044, 8, 1, 6, 30, 0, 0));
    });

    test("firstHalf true, endDay defined, slot.weekday doesn't match", () => {
      expect(myTerm.endDateFor(new Slot(69), true, [9, 5])).toStrictEqual(
        new Date(2044, 8, 1, 6, 30, 0, 0),
      );
    });
  });

  describe("Term.exDatesFor", () => {
    /**
     * Partition:
     * - has matching holiday, has non-matching holiday, has no holiday
     * - includes tuesday for monday schedule, doesn't include it
     */
    test("has matching holiday, tuesday on monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-08"], // NOTE: 2079-08-08 is a Tuesday
        mondayScheduleDate: "2079-08-11",
      });
      expect(
        myTerm.exDatesFor(new Slot(40)), // NOTE: slot 40 = Tuesday at 9:00 AM
      ).toStrictEqual([
        new Date(2079, 7, 8, 9, 0, 0, 0),
        new Date(1999, 11, 31, 9, 0, 0, 0),
        new Date(2079, 7, 11, 9, 0, 0, 0),
      ]);
    });

    test("has matching holiday, not monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-09"], // NOTE: 2079-08-09 is a Wednesday
        mondayScheduleDate: "2079-08-11",
      });
      expect(
        myTerm.exDatesFor(new Slot(100)), // NOTE: slot 100 = Wednesday at 10:00 PM
      ).toStrictEqual([
        new Date(2079, 7, 9, 22, 0, 0, 0),
        new Date(1999, 11, 31, 22, 0, 0, 0),
      ]);
    });

    test("has non-matching holiday, tuesday on monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-20"], // NOTE: 2079-08-20 is a Sunday
        mondayScheduleDate: "2079-08-11",
      });
      expect(
        myTerm.exDatesFor(new Slot(41)), // NOTE: slot 41 = Tuesday at 9:30 AM
      ).toStrictEqual([
        new Date(1999, 11, 31, 9, 30, 0, 0),
        new Date(2079, 7, 11, 9, 30, 0, 0),
      ]);
    });

    test("has non-matching holiday, not monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "m79",
        holidayDates: ["2079-08-14"], // NOTE: 2079-08-14 is a Monday
        mondayScheduleDate: "2079-08-11",
      });
      expect(
        myTerm.exDatesFor(new Slot(168)), // NOTE: slot 100 = Friday at 10:00 PM
      ).toStrictEqual([new Date(1999, 11, 31, 22, 0, 0, 0)]);
    });

    test("no holidays, tuesday for monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "f79",
        mondayScheduleDate: "2079-01-01",
      });
      expect(
        myTerm.exDatesFor(new Slot(34)), // NOTE: slot 34 = Tuesday at 6:00 AM
      ).toStrictEqual(
        [new Date(1999, 11, 31, 6, 0, 0, 0), new Date(2079, 0, 1, 6, 0, 0, 0)], // NOTE: in some timezones this shifts to 2000-01-01 so we hardcode "America/New_York" for reproducibility
      );
    });

    test("no holidays, not monday schedule", () => {
      const myTerm: Term = new Term({
        urlName: "f79",
        mondayScheduleDate: undefined,
      });
      expect(myTerm.exDatesFor(new Slot(34))).toStrictEqual([
        new Date(1999, 11, 31, 6, 0, 0, 0),
      ]);
    });
  });

  describe("Term.rDateFor", () => {
    /**
     * Partition:
     * - slot.weekday: 1, not 1
     * - this.mondaySchedule: defined undefined
     */
    test("slot.weekday Monday, this.mondaySchedule defined", () => {
      const myTerm: Term = new Term({
        urlName: "f56",
        mondayScheduleDate: "2056-04-24",
      });
      expect(myTerm.rDateFor(new Slot(0))).toStrictEqual(
        new Date(2056, 3, 24, 6, 0, 0, 0),
      );
    });

    test("slot.weekday not Monday, this.mondaySchedule defined", () => {
      const myTerm: Term = new Term({
        urlName: "f56",
        mondayScheduleDate: "2056-04-24",
      });
      expect(myTerm.rDateFor(new Slot(157))).toBeUndefined();
    });

    test("slot.weekday Monday, this.mondaySchedule undefined", () => {
      const myTerm: Term = new Term({ urlName: "s51" });
      expect(myTerm.rDateFor(new Slot(6))).toBeUndefined();
    });

    test("slot.weekday not Monday, this.mondaySchedule undefined", () => {
      const myTerm: Term = new Term({ urlName: "s51" });
      expect(myTerm.rDateFor(new Slot(118))).toBeUndefined();
    });
  });
});

describe("Slot", () => {
  /**
   * Test each method separately (most of them don't need to be partitioned)
   */
  test("Slot.fromSlotNumber", () => {
    const mySlot: Slot = Slot.fromSlotNumber(42);
    expect(mySlot.slot).toBe(42);
  });

  test("Slot.fromStartDate", () => {
    const myDate: Date = new Date(2001, 6, 19, 22, 1, 52, 23); // randomly chosen date
    const mySlot: Slot = Slot.fromStartDate(myDate);
    expect(mySlot.slot).toBe(134); // note: this was a Thursday (July 19, 2001), slot number 32
  });

  test("Slot.fromDayString", () => {
    const mySlot: Slot = Slot.fromDayString("Thu", "10:00 PM");
    expect(mySlot.slot).toBe(134);
  });

  test("Slot.add", () => {
    const mySlot: Slot = new Slot(125);
    const myOtherSlot: Slot = mySlot.add(-111);
    expect(myOtherSlot.slot).toBe(14);
  });

  test("Slot.onDate", () => {
    const mySlot: Slot = new Slot(125); // Thursday, 5:30 PM
    const myDate: Date = new Date(2068, 8, 6); // this is also a Thursday
    expect(mySlot.onDate(myDate)).toStrictEqual(new Date(2068, 8, 6, 17, 30));
  });

  test("Slot.startDate", () => {
    const mySlot: Slot = new Slot(62); // Tuesday, 8:00 PM
    expect(mySlot.startDate).toStrictEqual(new Date(2001, 0, 2, 20, 0));
  });

  test("Slot.endDate", () => {
    const mySlot: Slot = new Slot(130); // Thursday, 8:00 PM
    expect(mySlot.endDate).toStrictEqual(new Date(2001, 0, 4, 20, 30));
  });

  test("Slot.weekday", () => {
    const mySlot: Slot = new Slot(18); // Monday, 3:00 PM
    expect(mySlot.weekday).toBe(1);
  });

  test("Slot.dayString", () => {
    const mySlot: Slot = new Slot(12); // Monday, 12:00 PM
    expect(mySlot.dayString).toBe("Mon");
  });

  test("Slot.timeString", () => {
    const mySlot: Slot = new Slot(31); // Monday, 9:30 PM
    expect(mySlot.timeString).toBe("9:30 PM");
  });
});

describe("getUrlNames", () => {
  /**
   * Partition on urlName:
   * - EARLIEST_URL
   * - between EARLIEST_URL and excluded urls
   * - an excluded url
   * - after excluded urls
   */
  test("urlName === EARLIEST_URL", () => {
    expect(getUrlNames("f22")).toStrictEqual(["f22"]);
  });

  test("urlName is before excluded urls", () => {
    expect(getUrlNames("i23")).toStrictEqual(["i23", "f22"]);
  });

  test("urlName is excluded", () => {
    expect(getUrlNames("m23")).toStrictEqual(["m23", "s23", "f22"]);
  });

  test("urlName is after excluded urls", () => {
    expect(getUrlNames("i25")).toStrictEqual([
      "i25",
      "f24",
      "s24",
      "f23",
      "s23",
      "f22",
    ]);
  });
});

describe("toFullUrl", () => {
  /**
   * Partition:
   * - window.location.href: has parameters, has no parameters
   * - urlName, latestUrlName: same, different
   */

  assert(jsdom instanceof JSDOM); // otherwise eslint doesn't know what kind of thing `jsdom` is
  beforeEach(() => {
    // Reset URL before each test
    jsdom.reconfigure({ url: "http://localhost/" });
  });
  test("window.location.href has parameters, urlName = latestUrlName", () => {
    const myUrl = "https://example.com/?utm_source=lorem&utm_medium=ipsum";
    jsdom.reconfigure({ url: myUrl });
    expect(window.location.href).toBe(myUrl);
    expect(toFullUrl("lorem", "lorem")).toBe("https://example.com/");
  });

  test("window.location.href has no parameters, urlName = latestUrlName", () => {
    const myUrl = "https://example.com/";
    jsdom.reconfigure({ url: myUrl });
    expect(window.location.href).toBe(myUrl);
    expect(toFullUrl("lorem", "lorem")).toBe("https://example.com/");
  });

  test("window.location.href has parameters, urlName !== latestUrlName", () => {
    const myUrl = "https://example.com/?utm_source=lorem&utm_medium=ipsum";
    jsdom.reconfigure({ url: myUrl });
    expect(window.location.href).toBe(myUrl);
    expect(toFullUrl("lorem", "ipsum")).toBe("https://example.com/?t=lorem");
  });

  test("window.location.href has no parameters, urlName !== latestUrlName", () => {
    const myUrl = "https://example.com/";
    jsdom.reconfigure({ url: myUrl });
    expect(window.location.href).toBe(myUrl);
    expect(toFullUrl("lorem", "ipsum")).toBe("https://example.com/?t=lorem");
  });
});
