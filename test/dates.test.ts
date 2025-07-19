import assert from "node:assert";
import { describe, test } from "node:test";
import { parseUrlName } from "../src/lib/dates.js";

await test("parseUrlName", () => {
  assert.deepStrictEqual(parseUrlName("f22"), {
    year: "22",
    semester: "f",
  });
});

// TODO: figure out how to mock `window.location.href`