import assert from "node:assert";
import { after, before, describe, test } from "node:test";
import jsdomGlobal from "jsdom-global";
import {
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT_CONTRAST,
  COLOR_SCHEME_DARK_CONTRAST,
  fallbackColor,
  textColor,
  canonicalizeColor,
  getDefaultColorScheme,
} from "../src/lib/colors.js";

await describe("fallbackColor", async () => {
  /**
   * Test all 4 color modes
   */
  await test("COLOR_SCHEME_LIGHT", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_LIGHT), "#4A5568");
  });

  await test("COLOR_SCHEME_DARK", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_DARK), "#CBD5E0");
  });

  await test("COLOR_SCHEME_LIGHT_CONTRAST", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_LIGHT_CONTRAST), "#4A5568");
  });

  await test("COLOR_SCHEME_DARK_CONTRAST", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_DARK_CONTRAST), "#CBD5E0");
  });
});

await describe("getDefaultColorScheme", async () => {
  /**
   * Partition:
   * - prefers-color-scheme: light, dark
   * - prefers-contrast: no-preference, more
   */

  // Some declarations
  let cleanup: () => void;
  function myUncallableFunction(_: unknown): void {
    throw new Error("Don't call me!");
  }

  function myUncallableDispatcher(_: unknown): boolean {
    throw new Error("Don't call me!");
  }

  // a function to create window.matchMedia mocks on the fly
  function makeMatchMediaMock(matchMediaMap: Map<string, boolean>): void {
    // the mock function to assign to window.matchMedia
    function matchMediaMock(query: string): MediaQueryList {
      return {
        matches: matchMediaMap.get(query) ?? false,
        media: query,
        onchange: null,
        addListener: myUncallableFunction,
        removeListener: myUncallableFunction,
        addEventListener: myUncallableFunction,
        removeEventListener: myUncallableFunction,
        dispatchEvent: myUncallableDispatcher,
      };
    }
    // actually assign this mock function!
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  }

  // before and after hooks to simplify the code
  before(() => {
    cleanup = jsdomGlobal();
  });

  after(() => {
    cleanup();
  });

  await test("prefers-color-scheme = light, prefers-constrast = no-preference", () => {
    makeMatchMediaMock(
      new Map<string, boolean>([
        ["(prefers-color-scheme: dark)", false],
        ["(prefers-constrast: more)", false],
      ]),
    );
    assert.deepStrictEqual(getDefaultColorScheme(), COLOR_SCHEME_LIGHT);
  });

  await test.skip("prefers-color-scheme = light, prefers-constrast = more");

  await test.skip(
    "prefers-color-scheme = dark, prefers-constrast = no-preference",
  );

  await test.skip("prefers-color-scheme = dark, prefers-constrast = more");
});

await describe("textColor", async () => {
  /**
   * Partition on `brightness`:
   * - exactly 0
   * - between 0 and 128 exclusive
   * - exactly 128
   * - between 128 and 256 exclusive
   * - exactly 256
   */
  await test("brightness === 0", () => {
    assert.deepStrictEqual(textColor("#000000"), "#ffffff");
  });

  await test("0 < brightness < 128", () => {
    assert.deepStrictEqual(textColor("#217ac8"), "#ffffff"); // randomly generated colors
  });

  await test("brightness === 128", () => {
    assert.deepStrictEqual(textColor("#808080"), "#ffffff");
  });

  await test("128 < brightness < 256", () => {
    assert.deepStrictEqual(textColor("#c5accc"), "#000000");
  });

  await test("brightness === 256", () => {
    assert.deepStrictEqual(textColor("#ffffff"), "#000000");
  });
});

await describe("canonicalizeColor", async () => {
  /**
   * Partition:
   * - valid 6-symbol hex code (with or without #)
   * - valid 5-symbol hex code (with or without #)
   * - valid 3-symbol hex code (with or without #)
   * - not valid
   */
  await test("6-symbol hex with #", () => {
    assert.strictEqual(canonicalizeColor("#AC26C4"), "#AC26C4"); // random colors generated using RNG
  });

  await test("6-symbol hex without #", () => {
    assert.strictEqual(canonicalizeColor("28259A"), "#28259A");
  });

  await test("5-symbol hex with #", () => {
    assert.strictEqual(canonicalizeColor("#AA1B8"), "#AA1B8");
  });

  await test("5-symbol hex without #", () => {
    assert.strictEqual(canonicalizeColor("9C863"), "#9C863");
  });

  await test("3-symbol hex with #", () => {
    assert.strictEqual(canonicalizeColor("#A51"), "AA5511");
  });

  await test("3-symbol hex without #", () => {
    assert.strictEqual(canonicalizeColor("12B"), "#1122BB");
  });

  await test("invalid hex code", () => {
    assert.strictEqual(canonicalizeColor("have a great day!"), undefined);
  });
});
