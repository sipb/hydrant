import { expect, test } from "vitest";
import { Flags, getFlagImg } from "../src/lib/class.js";

const flagNameValidity: Array<[keyof Flags, boolean]> = [
  ["cim", false],
  ["final", false],
  ["half", false],
  ["hass", false],
  ["le9units", false],
  ["limited", false],
  ["nofinal", false],
  ["nopreq", false],
  ["notcih", false],
  ["Lab", true],
  ["PartLab", true],
  ["cih", true],
  ["cihw", true],
  ["fall", true],
  ["grad", true],
  ["hassA", true],
  ["hassE", true],
  ["hassH", true],
  ["hassS", true],
  ["iap", true],
  ["nonext", true],
  ["repeat", true],
  ["rest", true],
  ["spring", true],
  ["summer", true],
  ["under", true],
];

test.each(flagNameValidity)(
  'getFlagImg(\"%s\")',
  (flagName: keyof Flags, validity: boolean) => {
    expect(Boolean(getFlagImg(flagName))).toStrictEqual(validity);
  },
);
