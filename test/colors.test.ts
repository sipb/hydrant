import { describe, test } from "node:test";
// TODO: import relevant functions from src/lib/colors.ts

await describe("fallbackColor", async () => {
  /**
   * Test all 4 color modes
   */
  await test.skip("COLOR_SCHEME_LIGHT");

  await test.skip("COLOR_SCHEME_DARK");

  await test.skip("COLOR_SCHEME_LIGHT_CONTRAST");

  await test.skip("COLOR_SCHEME_DARK_CONTRAST");
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
