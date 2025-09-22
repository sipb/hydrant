import { afterEach, expect, describe, test } from "vitest";
import { Store } from "../src/lib/store.js";
import type { Preferences } from "../src/lib/schema.js";

// note that jsdom supports localStorage since v11.12.0; c.f. github.com/jsdom/jsdom/blob/main/Changelog.md
describe("Store", () => {
  // create a Store object once and for all, since they touch the same localStorage anyways
  const myStore: Store = new Store("lorem");

  afterEach(() => {
    localStorage.clear();
  });

  describe("Store.toKey", () => {
    test("store.toKey with global = true", () => {
      expect(myStore.toKey("ipsum", true)).toStrictEqual("ipsum");
    });

    test("store.toKey with global = false", () => {
      expect(myStore.toKey("ipsum", false)).toStrictEqual("lorem-ipsum");
    });
  });

  test("Store.set and Store.get", () => {
    myStore.set("alpha", []);
    expect(myStore.get("alpha")).toStrictEqual([]);
  });

  test("Store.get with key not found", () => {
    expect(myStore.get("alpha")).toStrictEqual(null);
  });

  test("Store.globalSet and Store.globalGet", () => {
    const myPreferences: Preferences = {
      colorScheme: null,
      roundedCorners: false,
      showEventTimes: false,
      defaultScheduleId: null,
      showFeedback: false,
    };
    myStore.globalSet("preferences", myPreferences);
    expect(myStore.globalGet("preferences")).toStrictEqual(myPreferences);
  });

  test("Store.globalGet with key not found", () => {
    expect(myStore.globalGet("preferences")).toStrictEqual(null);
  });
});
