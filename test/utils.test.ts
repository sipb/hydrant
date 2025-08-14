import { assert, test, describe } from 'vitest'
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
    assert.strictEqual(classSort(null, null), 0);
  });

  test("a null, b not null", () => {
    assert.strictEqual(classSort(null, "lorem"), 1);
  });

  test("b null, a not null", () => {
    assert.strictEqual(classSort("ipsum", null), -1);
  });

  test("a & b both invalid", () => {
    assert.strictEqual(classSort("HeLlO", "wOrLd"), 0);
  });

  test("a invalid, b valid", () => {
    assert.strictEqual(classSort("dolor", "1A.2B"), 0);
  });

  test("a valid, b invalid", () => {
    assert.strictEqual(classSort("3C.4D", "sit"), 0);
  });

  test("a no course number, b has course number", () => {
    assert.strictEqual(classSort("A.1", "1.234"), 1);
  });

  test("b no course number, a has course number", () => {
    assert.strictEqual(classSort("5.678", "B.9"), -1);
  });

  test("a has greater course number than b", () => {
    assert.strictEqual(classSort("1.23", "0.12"), 1);
  });

  test("a has lesser course number than b", () => {
    assert.strictEqual(classSort("1.01", "2.56"), -1);
  });

  test("same course number, a has greater course letter than b", () => {
    assert.strictEqual(classSort("1BETA.1", "1ALPHA.2"), 1);
  });

  test("same course number, a has lesser course letter than b", () => {
    assert.strictEqual(classSort("1DELTA.3", "1EPSILON.4"), -1);
  });

  test("same course number and letter, a has greater class number than b", () => {
    assert.strictEqual(classSort("AWS.208", "AWS.084"), 1);
  });

  test("same course number and letter, a has lesser class number than b", () => {
    assert.strictEqual(classSort("1234.271", "1234.316"), -1);
  });

  test("everything is identical", () => {
    assert.strictEqual(classSort("4BF.261", "4BF.261"), 0);
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
    assert.strictEqual(classNumberMatch("1.234", "1.234", true), true);
  });

  test("searchString contains period, classNumber doesn't match, exact = true", () => {
    assert.strictEqual(classNumberMatch("1.234", "5.678", true), false);
  });

  test("searchString contains period, classNumber matches, exact = false", () => {
    assert.strictEqual(classNumberMatch("1.35", "1.357", false), true);
  });

  test("searchString contains period, classNumber matches, exact = false", () => {
    assert.strictEqual(classNumberMatch("1.35", "2.46", false), false);
  });

  test("searchString without period, classNumber matches, exact = true", () => {
    assert.strictEqual(classNumberMatch("1234", "1.234", true), true);
  });

  test("searchString without period, classNumber doesn't match, exact = true", () => {
    assert.strictEqual(classNumberMatch("1234", "5.678", true), false);
  });

  test("searchString without period, classNumber matches, exact = false", () => {
    assert.strictEqual(classNumberMatch("1A35", "1A.357", false), true);
  });

  test("searchString without period, classNumber matches, exact = false", () => {
    assert.strictEqual(classNumberMatch("1A35", "2B.46", false), false);
  });
});

describe("sum", () => {
  /* partition: length 0, 1, >1
     NOTE: test cases are intentionally chosen somewhat randomly
     */
  test("length 0", () => {
    assert.strictEqual(sum([]), 0);
  });

  test("length 1", () => {
    assert.strictEqual(sum([15]), 15);
  });

  test("length >1", () => {
    assert.strictEqual(sum([9, 1, 1, 8]), 19);
  });
});

test("urlencode followed by urldecode", () => {
  // arbitrarily chosen; change this to whatever you want
  const someRandomTestData: unknown = {
    lorem: 3,
    ipsum: "hello",
    dolor: { 1: 1, 2: 2 },
  };
  assert.deepStrictEqual(
    urldecode(urlencode(someRandomTestData)),
    someRandomTestData,
  );
});

describe("simplifyString", () => {
  /**
   * Partition on characters used:
   * - has uppercase letters: yes, no
   * - has non-alphanumeric symbols: yes, no
   */
  test("keeps lowercase only same", () => {
    assert.strictEqual(simplifyString("hi"), "hi");
  });

  test("keeps number same", () => {
    assert.strictEqual(simplifyString("42"), "42");
  });

  test("has uppercase letters, no non-alphanumeric symbols", () => {
    assert.strictEqual(simplifyString("Hello42"), "hello42");
  });

  test("has non-alphanumeric symbols, no uppercase letters", () => {
    assert.strictEqual(simplifyString(".1223h9f obanboit"), "1223h9fobanboit");
  });

  test("has non-alphanumeric symbols and uppercase letters", () => {
    assert.strictEqual(
      simplifyString("OH) U$oiu262 HUG*$ uIo"),
      "ohuoiu262huguio",
    );
  });
});
