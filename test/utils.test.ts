import { test, describe, expect } from 'vitest'
import {
  classSort,
  classNumberMatch,
  sum,
  urlencode,
  urldecode,
  simplifyString,
} from "../src/lib/utils";

describe("classSort", () => {
  /**
   * Partition:
   * - a & b both null/undefined
   * - a null only
   * - b null only
   * - a & b both invalid
   * - a only invalid
   * - b only invalid
   * - aCourseNumber and bCourseNumber both infinity
   * - aCourseNumber infinity, bCourseNumber finite
   * - bCourseNumber infinity, aCourseNumber finite
   * - aCourseNumber > bCourseNumber (both finite)
   * - bCourseNumber > aCourseNumber (both finite)
   * - aCourseNumber = bCourseNumber, aGroups.courseLetters > bGroups.courseLetters
   * - aCourseNumber = bCourseNumber, bGroups.courseLetters > aGroups.courseLetters
   * - aCourseNumber = bCourseNumber, aGroups.courseLetters = bGroups.courseLetters
   * - course numbers & letters match, aGroups.classNumber > bGroups.classNumber
   * - course numbers & letters match, bGroups.classNumber > aGroups.classNumber
   * - everything matches
   */
  test("a and b both null", () => {
    expect(classSort(null, null)).toBe(0);
  });

  test("a null, b not null", () => {
    expect(classSort(null, "lorem")).toBe(1);
  });

  test("b null, a not null", () => {
    expect(classSort("ipsum", null)).toBe(-1);
  });

  test("a & b both invalid", () => {
    expect(classSort("HeLlO", "wOrLd")).toBe(0);
  });

  test("a invalid, b valid", () => {
    expect(classSort("dolor", "1A.2B")).toBe(0);
  });

  test("a valid, b invalid", () => {
    expect(classSort("3C.4D", "sit")).toBe(0);
  });

  test("a no course number, b has course number", () => {
    expect(classSort("A.1", "1.234")).toBe(1);
  });

  test("b no course number, a has course number", () => {
    expect(classSort("5.678", "B.9")).toBe(-1);
  });

  test("a has greater course number than b", () => {
    expect(classSort("1.23", "0.12")).toBe(1);
  });

  test("a has lesser course number than b", () => {
    expect(classSort("1.01", "2.56")).toBe(-1);
  });

  test("same course number, a has greater course letter than b", () => {
    expect(classSort("1BETA.1", "1ALPHA.2")).toBe(1);
  });

  test("same course number, a has lesser course letter than b", () => {
    expect(classSort("1DELTA.3", "1EPSILON.4")).toBe(-1);
  });

  test("same course number and letter, a has greater class number than b", () => {
    expect(classSort("AWS.208", "AWS.084")).toBe(1);
  });

  test("same course number and letter, a has lesser class number than b", () => {
    expect(classSort("1234.271", "1234.316")).toBe(-1);
  });

  test("everything is identical", () => {
    expect(classSort("4BF.261", "4BF.261")).toBe(0);
  });
});

describe("classNumberMatch", () => {
  /**
   * Partition:
   * - searchString: contains ".", doesn't contain "."
   * - classNumber: identical, non-identical match, not a match
   * - exact: true, false
   */
  test("searchString contains period, classNumber matches, exact = true", () => {
    expect(classNumberMatch("1.234", "1.234", true)).toBe(true);
  });

  test("searchString contains period, classNumber doesn't match, exact = true", () => {
    expect(classNumberMatch("1.234", "5.678", true)).toBe(false);
  });

  test("searchString contains period, classNumber matches, exact = false", () => {
    expect(classNumberMatch("1.35", "1.357", false)).toBe(true);
  });

  test("searchString contains period, classNumber matches, exact = false", () => {
    expect(classNumberMatch("1.35", "2.46", false)).toBe(false);
  });

  test("searchString without period, classNumber matches, exact = true", () => {
    expect(classNumberMatch("1234", "1.234", true)).toBe(true);
  });

  test("searchString without period, classNumber doesn't match, exact = true", () => {
    expect(classNumberMatch("1234", "5.678", true)).toBe(false);
  });

  test("searchString without period, classNumber matches, exact = false", () => {
    expect(classNumberMatch("1A35", "1A.357", false)).toBe(true);
  });

  test("searchString without period, classNumber matches, exact = false", () => {
    expect(classNumberMatch("1A35", "2B.46", false)).toBe(false);
  });
});

describe("sum", () => {
  /* partition: length 0, 1, >1
     NOTE: test cases are intentionally chosen somewhat randomly
     */
  test("length 0", () => {
    expect(sum([])).toBe(0);
  });

  test("length 1", () => {
    expect(sum([15])).toBe(15);
  });

  test("length >1", () => {
    expect(sum([9, 1, 1, 8])).toBe(19);
  });
});

test("urlencode followed by urldecode", () => {
  // arbitrarily chosen; change this to whatever you want
  const someRandomTestData: unknown = {
    lorem: 3,
    ipsum: "hello",
    dolor: { 1: 1, 2: 2 },
  };
  expect(urldecode(urlencode(someRandomTestData))).toStrictEqual(someRandomTestData);
});

describe("simplifyString", () => {
  /**
   * Partition on characters used:
   * - has uppercase letters: yes, no
   * - has non-alphanumeric symbols: yes, no
   */
  test("keeps lowercase only same", () => {
    expect(simplifyString("hi")).toBe("hi");
  });

  test("keeps number same", () => {
    expect(simplifyString("42")).toBe("42");
  });

  test("has uppercase letters, no non-alphanumeric symbols", () => {
    expect(simplifyString("Hello42")).toBe("hello42");
  });

  test("has non-alphanumeric symbols, no uppercase letters", () => {
    expect(simplifyString(".1223h9f obanboit")).toBe("1223h9fobanboit");
  });

  test("has non-alphanumeric symbols and uppercase letters", () => {
    expect(simplifyString("OH) U$oiu262 HUG*$ uIo")).toBe("ohuoiu262huguio");
  });
});
