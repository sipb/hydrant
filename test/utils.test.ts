import assert from "node:assert";
import { describe, test } from "node:test";
import {
  sum,
  urlencode,
  urldecode,
  simplifyString,
} from "../src/lib/utils.jsx"; // NOTE: you MUST use `tsx` to run this, since we're importing a tsx file

test("example", (t) => {
  assert.strictEqual(1, 1);
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
