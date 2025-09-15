import { afterEach, expect, describe, test } from "vitest";
import { Store } from "../src/lib/store.js";

// TODO: write these tests
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

  // double check that localStorage really works
  test("localStorage sanity check", () => {
    expect(localStorage.length).toStrictEqual(0);
    localStorage.setItem("lorem", "ipsum");
    expect(localStorage.getItem("lorem")).toStrictEqual("ipsum");
    expect(localStorage.length).toStrictEqual(1);
  });

  test("localStorage sanity check 2", () => {
    // if afterEach hook is disabled, this will fail because the storage hasn't been cleared
    expect(localStorage.length).toStrictEqual(0);
  });

  test.skip("Store.get");

  test.skip("Store.globalGet");

  test.skip("Store.set");

  test.skip("Store.globalSet");
});
