import assert from "node:assert";
import { describe, test } from "node:test";
import { parseUrlName, getClosestUrlName } from "../src/lib/dates.js";

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

  // TODO: implement these (and possibly a better partition for this?)
  await test.skip("getUrlNames(latestUrlName) includes urlName");

  await test.skip(
    "EXCLUDED_URLS includes urlName, urlName includes nextUrlName",
  );

  await test.skip("unrecognized term");

  await test.skip("fallback to latest term");
});

// TODO: figure out how to mock `window.location.href`
