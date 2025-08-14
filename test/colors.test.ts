import { assert, test, describe } from 'vitest'
import {
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT_CONTRAST,
  COLOR_SCHEME_DARK_CONTRAST,
  fallbackColor,
  textColor,
  canonicalizeColor,
  getDefaultColorScheme,
} from "../src/lib/colors";

describe("fallbackColor", () => {
  /**
   * Test all 4 color modes
   */
  test("COLOR_SCHEME_LIGHT", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_LIGHT), "#4A5568");
  });

  test("COLOR_SCHEME_DARK", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_DARK), "#CBD5E0");
  });

  test("COLOR_SCHEME_LIGHT_CONTRAST", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_LIGHT_CONTRAST), "#4A5568");
  });

  test("COLOR_SCHEME_DARK_CONTRAST", () => {
    assert.strictEqual(fallbackColor(COLOR_SCHEME_DARK_CONTRAST), "#CBD5E0");
  });
});

describe("getDefaultColorScheme", () => {
  /**
   * Partition:
   * - prefers-color-scheme: light, dark
   * - prefers-contrast: no-preference, more
   */

  // Some declarations
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

  test("prefers-color-scheme = light, prefers-constrast = no-preference", () => {
    makeMatchMediaMock(
      new Map<string, boolean>([
        ["(prefers-color-scheme: dark)", false],
        ["(prefers-constrast: more)", false],
      ]),
    );
    assert.deepStrictEqual(getDefaultColorScheme(), COLOR_SCHEME_LIGHT);
  });

  test("prefers-color-scheme = light, prefers-constrast = more", () => {
    makeMatchMediaMock(
      new Map<string, boolean>([
        ["(prefers-color-scheme: dark)", false],
        ["(prefers-constrast: more)", true],
      ]),
    );
    assert.deepStrictEqual(
      getDefaultColorScheme(),
      COLOR_SCHEME_LIGHT_CONTRAST,
    );
  });

  test("prefers-color-scheme = dark, prefers-constrast = no-preference", () => {
    makeMatchMediaMock(
      new Map<string, boolean>([
        ["(prefers-color-scheme: dark)", true],
        ["(prefers-constrast: more)", false],
      ]),
    );
    assert.deepStrictEqual(getDefaultColorScheme(), COLOR_SCHEME_DARK);
  });

  test("prefers-color-scheme = dark, prefers-constrast = no-preference", () => {
    makeMatchMediaMock(
      new Map<string, boolean>([
        ["(prefers-color-scheme: dark)", true],
        ["(prefers-constrast: more)", true],
      ]),
    );
    assert.deepStrictEqual(getDefaultColorScheme(), COLOR_SCHEME_DARK_CONTRAST);
  });
});

describe("textColor", () => {
  /**
   * Partition on `brightness`:
   * - exactly 0
   * - between 0 and 128 exclusive
   * - exactly 128
   * - between 128 and 256 exclusive
   * - exactly 256
   */
  test("brightness === 0", () => {
    assert.deepStrictEqual(textColor("#000000"), "#ffffff");
  });

  test("0 < brightness < 128", () => {
    assert.deepStrictEqual(textColor("#217ac8"), "#ffffff"); // randomly generated colors
  });

  test("brightness === 128", () => {
    assert.deepStrictEqual(textColor("#808080"), "#ffffff");
  });

  test("128 < brightness < 256", () => {
    assert.deepStrictEqual(textColor("#c5accc"), "#000000");
  });

  test("brightness === 256", () => {
    assert.deepStrictEqual(textColor("#ffffff"), "#000000");
  });
});

describe("canonicalizeColor", () => {
  /**
   * Partition:
   * - valid 6-symbol hex code (with or without #)
   * - valid 5-symbol hex code (with or without #)
   * - valid 3-symbol hex code (with or without #)
   * - not valid
   */
  test("6-symbol hex with #", () => {
    assert.strictEqual(canonicalizeColor("#AC26C4"), "#AC26C4"); // random colors generated using RNG
  });

  test("6-symbol hex without #", () => {
    assert.strictEqual(canonicalizeColor("28259A"), "#28259A");
  });

  test("5-symbol hex with #", () => {
    assert.strictEqual(canonicalizeColor("#AA1B8"), "#AA1B8");
  });

  test("5-symbol hex without #", () => {
    assert.strictEqual(canonicalizeColor("9C863"), "#9C863");
  });

  test("3-symbol hex with #", () => {
    assert.strictEqual(canonicalizeColor("#A51"), "AA5511");
  });

  test("3-symbol hex without #", () => {
    assert.strictEqual(canonicalizeColor("12B"), "#1122BB");
  });

  test("invalid hex code", () => {
    assert.strictEqual(canonicalizeColor("have a great day!"), undefined);
  });
});
