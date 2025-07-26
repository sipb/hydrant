import assert from "node:assert";
import { describe, test } from "node:test";
import {
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT_CONTRAST,
  COLOR_SCHEME_DARK_CONTRAST,
  fallbackColor,
  textColor,
  canonicalizeColor,
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
  await test.skip(
    "prefers-color-scheme = light, prefers-contrast = no-preference",
  );

  await test.skip("prefers-color-scheme = light, prefers-contrast = more");

  await test.skip(
    "prefers-color-scheme = dark, prefers-contrast = no-preference",
  );

  await test.skip("prefers-color-scheme = dark, prefers-contrast = more");
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

  await test.skip("128 < brightness < 256", () => {
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
