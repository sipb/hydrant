import assert from "node:assert";
import { describe, test } from "node:test";
import {
  classNumberMatch,
  sum,
  urlencode,
  urldecode,
  simplifyString,
} from "../src/lib/utils.jsx"; // NOTE: you MUST use `tsx` to run this, since we're importing a tsx file

test("example", (t) => {
  assert.strictEqual(1, 1);
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
