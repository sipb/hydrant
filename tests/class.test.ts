import { expect, test } from "vitest";
import { getFlagImg } from "../src/lib/class.js";

// TODO: replace these with actual tests
test("sanity check", () => {
  expect(1 + 1).toStrictEqual(2);
});

test("sanity check 2", () => {
  expect(getFlagImg).toBeTruthy();
});
