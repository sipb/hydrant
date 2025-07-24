import assert from "node:assert";
import { describe, test } from "node:test";
import {
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT_CONTRAST,
  COLOR_SCHEME_DARK_CONTRAST,
  fallbackColor,
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

await test.skip("textColor");

await describe("canonicalizeColor", async () => {
  /**
   * Partition:
   * - valid 6-symbol hex code (with or without #)
   * - valid 5-symbol hex code (with or without #)
   * - valid 3-symbol hex code (with or without #)
   * - not valid
   */
  await test.skip("6-symbol hex with #");

  await test.skip("6-symbol hex without #");

  await test.skip("5-symbol hex with #");

  await test.skip("5-symbol hex without #");

  await test.skip("3-symbol hex with #");

  await test.skip("3-symbol hex without #");

  await test.skip("invalid hex code");
});
