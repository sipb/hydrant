import { expect, describe, test } from "vitest";
import { LocalStorage } from "node-localstorage";

test("node-localstorage sanity check", () => {
  expect(LocalStorage).toBeDefined();
  const myLocalStorage: Storage = new LocalStorage("./storage.txt");
  expect(myLocalStorage).toBeDefined();
  myLocalStorage._deleteLocation();
});

// TODO
describe("Store", () => {
  test.skip("Store.toKey");

  test.skip("Store.get");

  test.skip("Store.globalGet");

  test.skip("Store.set");

  test.skip("Store.globalSet");
});
