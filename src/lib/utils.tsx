import { Link } from "@chakra-ui/react";
import { unpack, pack } from "msgpackr";
import type { JSX } from "react/jsx-runtime";

import type { State } from "./state";

//========================================================================
// Class utilities:

/**
 * This regex matches a class number like 6.042J or 21W.THU. The groups are
 * courseDigits ("6", "21"), courseLetters ("", "W"), and classNumber ("042J",
 * "THU").
 */
const CLASS_REGEX = new RegExp(
  [
    "^",
    "(?<courseDigits>[0-9]*)",
    "(?<courseLetters>[A-Z]*)",
    "\\.",
    "(?<classNumber>[0-9A-Z]*)",
    "$",
  ].join(""),
);

/** Three-way comparison for class numbers. */
export function classSort(
  a: string | null | undefined,
  b: string | null | undefined,
) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const aGroups = CLASS_REGEX.exec(a)?.groups;
  const bGroups = CLASS_REGEX.exec(b)?.groups;
  if (!aGroups || !bGroups) return 0;
  const aCourseNumber = Number(aGroups.courseDigits || "Infinity");
  const bCourseNumber = Number(bGroups.courseDigits || "Infinity");
  if (aCourseNumber > bCourseNumber) return 1;
  if (aCourseNumber < bCourseNumber) return -1;
  if (aGroups.courseLetters > bGroups.courseLetters) return 1;
  if (aGroups.courseLetters < bGroups.courseLetters) return -1;
  if (aGroups.classNumber > bGroups.classNumber) return 1;
  if (aGroups.classNumber < bGroups.classNumber) return -1;
  return 0;
}

/** Turn a string lowercase and keep only alphanumeric characters. */
export function simplifyString(s: string): string {
  return s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

/**
 * Smart class number matching. Case-insensitive. Punctuation-insensitive when
 * the searchString has no punctuation, but cares otherwise.
 */
export function classNumberMatch(
  searchString: string,
  classNumber: string,
  exact = false,
): boolean {
  const process = (s: string) =>
    searchString.includes(".") ? s.toLowerCase() : simplifyString(s);
  const compare = (a: string, b: string) => (exact ? a === b : a.includes(b));
  return compare(process(classNumber), process(searchString));
}

/** Wrapper to link all classes in a given string. */
export function linkClasses(state: State, str: string): JSX.Element {
  return (
    <>
      {str.split(/([0-9]*[A-Z]*\.[0-9A-Z]+)/).map((text, i) => {
        const cls = state.classes.get(text);
        if (!cls) return text;
        return (
          <Link
            key={i}
            onClick={() => {
              state.setViewedActivity(cls);
            }}
            colorPalette="blue"
          >
            {text}
          </Link>
        );
      })}
    </>
  );
}

//========================================================================
// Other utilities:

/** Takes the sum of an array. */
export function sum(arr: number[]): number {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

export function urlencode(obj: unknown): string {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
  // return pack(obj).toBase64();
  return btoa(String.fromCharCode(...pack(obj)));
}

export function urldecode(obj: string): unknown {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64
  // return unpack(Uint8Array.fromBase64(obj));
  return unpack(
    Uint8Array.from(
      atob(obj)
        .split("")
        .map((c) => c.charCodeAt(0)),
    ),
  );
}
