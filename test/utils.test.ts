import assert from "node:assert";
import { describe, test } from "node:test";
import { sum } from "../src/lib/utils.jsx"; // NOTE: you MUST use `tsx` to run this, since we're importing a tsx file

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
