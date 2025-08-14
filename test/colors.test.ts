import { test, describe, expect, vi } from 'vitest'
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
    expect(fallbackColor(COLOR_SCHEME_LIGHT)).toBe("#4A5568");
  });

  test("COLOR_SCHEME_DARK", () => {
    expect(fallbackColor(COLOR_SCHEME_DARK)).toBe("#CBD5E0");
  });

  test("COLOR_SCHEME_LIGHT_CONTRAST", () => {
    expect(fallbackColor(COLOR_SCHEME_LIGHT_CONTRAST)).toBe("#4A5568");
  });

  test("COLOR_SCHEME_DARK_CONTRAST", () => {
    expect(fallbackColor(COLOR_SCHEME_DARK_CONTRAST)).toBe("#CBD5E0");
  });
});

describe("getDefaultColorScheme", () => {
  /**
   * Partition:
   * - prefers-color-scheme: light, dark
   * - prefers-contrast: no-preference, more
   */

  // a function to create window.matchMedia mocks on the fly
  function makeMatchMediaMock(matchMediaMap: Map<string, boolean>): void {
    // the mock function to assign to window.matchMedia
    function matchMediaMock(query: string): MediaQueryList {
      return {
        matches: matchMediaMap.get(query) ?? false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
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
    expect(getDefaultColorScheme()).toStrictEqual(COLOR_SCHEME_LIGHT);
  });

  test("prefers-color-scheme = light, prefers-constrast = more", () => {
    makeMatchMediaMock(
      new Map<string, boolean>([
        ["(prefers-color-scheme: dark)", false],
        ["(prefers-constrast: more)", true],
      ]),
    );
    expect(
      getDefaultColorScheme()
    ).toStrictEqual(
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
    expect(
      getDefaultColorScheme()
    ).toStrictEqual(
      COLOR_SCHEME_DARK,
    );
  });

  test("prefers-color-scheme = dark, prefers-constrast = no-preference", () => {
    makeMatchMediaMock(
      new Map<string, boolean>([
        ["(prefers-color-scheme: dark)", true],
        ["(prefers-constrast: more)", true],
      ]),
    );
    expect(
      getDefaultColorScheme()
    ).toStrictEqual(
      COLOR_SCHEME_DARK_CONTRAST,
    );
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
    expect(textColor("#000000")).toBe("#ffffff");
  });

  test("0 < brightness < 128", () => {
    expect(textColor("#217ac8")).toBe("#ffffff"); // randomly generated colors
  });

  test("brightness === 128", () => {
    expect(textColor("#808080")).toBe("#ffffff");
  });

  test("128 < brightness < 256", () => {
    expect(textColor("#c5accc")).toBe("#000000");
  });

  test("brightness === 256", () => {
    expect(textColor("#ffffff")).toBe("#000000");
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
    expect(canonicalizeColor("#AC26C4")).toBe("#AC26C4"); // random colors generated using RNG
  });

  test("6-symbol hex without #", () => {
    expect(canonicalizeColor("28259A")).toBe("#28259A");
  });

  test("5-symbol hex with #", () => {
    expect(canonicalizeColor("#AA1B8")).toBe("#AA1B8");
  });

  test("5-symbol hex without #", () => {
    expect(canonicalizeColor("9C863")).toBe("#9C863");
  });

  test("3-symbol hex with #", () => {
    expect(canonicalizeColor("#A51")).toBe("AA5511");
  });

  test("3-symbol hex without #", () => {
    expect(canonicalizeColor("12B")).toBe("#1122BB");
  });

  test("invalid hex code", () => {
    expect(canonicalizeColor("have a great day!")).toBeUndefined();
  });
});
