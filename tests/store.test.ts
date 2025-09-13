import { expect, describe, test } from "vitest";
import { LocalStorage } from "node-localstorage";
import { Store } from "../src/lib/store.js";

test("node-localstorage sanity check", () => {
  expect(LocalStorage).toBeDefined();
  const myLocalStorage: Storage = new LocalStorage("./storage.txt");
  expect(myLocalStorage).toBeDefined();
  myLocalStorage._deleteLocation();
});

// TODO
describe("Store", () => {
  // create a Store object once and for all, since they touch the same localStorage anyways
  const myStore: Store = new Store("lorem");

  describe("Store.toKey", () => {
    test("store.toKey with global = true", () => {
      expect(myStore.toKey("ipsum", true)).toStrictEqual("ipsum");
    });

    test("store.toKey with global = false", () => {
      expect(myStore.toKey("ipsum", false)).toStrictEqual("lorem-ipsum");
    });
  });

  test.skip("Store.get");

  test.skip("Store.globalGet");

  test.skip("Store.set");

  test.skip("Store.globalSet");
});
