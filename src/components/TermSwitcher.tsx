import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./ui/select";

import { createListCollection } from "@chakra-ui/react";

import { State } from "../lib/state";
import { Term } from "../lib/dates";

/** Given a urlName like i22, return its corresponding URL. */
function toFullUrl(urlName: string, latestUrlName: string): string {
  const url = new URL(window.location.href);
  Array.from(url.searchParams.keys()).forEach((key) => {
    url.searchParams.delete(key);
  });
  if (urlName !== latestUrlName) {
    url.searchParams.set("t", urlName);
  }
  return url.href;
}

/** Given a urlName like "i22", return the previous one, "f21". */
function getLastUrlName(urlName: string): string {
  const { semester, year } = new Term({ urlName });
  switch (semester) {
    case "f":
      return `m${year}`;
    case "m":
      return `s${year}`;
    case "s":
      return `i${year}`;
    case "i":
      return `f${parseInt(year, 10) - 1}`;
  }
}

/** urlNames that don't have a State */
const EXCLUDED_URLS = ["i23", "s23", "i24", "s24"];

/** Earliest urlName we have a State for. */
const EARLIEST_URL = "f22";

/** Return all urlNames before the given one. */
function getUrlNames(latestUrlName: string): Array<string> {
  let urlName = latestUrlName;
  const res = [];
  while (urlName !== EARLIEST_URL) {
    res.push(urlName);
    do {
      urlName = getLastUrlName(urlName);
    } while (EXCLUDED_URLS.includes(urlName));
  }
  res.push(EARLIEST_URL);
  return res;
}

export function TermSwitcher(props: { state: State }) {
  const { state } = props;
  const toUrl = (urlName: string) => toFullUrl(urlName, state.latestUrlName);
  const defaultValue = toUrl(state.term.urlName);

  return (
    <SelectRoot
      collection={createListCollection({
        items: getUrlNames(state.latestUrlName).map((urlName) => {
          const { niceName } = new Term({ urlName });
          return {
            label: niceName,
            value: toUrl(urlName),
          };
        }),
      })}
      value={[defaultValue]}
      onValueChange={(e) => {
        window.location.href = e.value[0];
      }}
      size="sm"
      w="8rem"
      mr={3}
    >
      <SelectLabel hidden>Select semester</SelectLabel>
      <SelectTrigger>
        <SelectValueText />
      </SelectTrigger>
      <SelectContent>
        {getUrlNames(state.latestUrlName).map((urlName) => {
          const { niceName } = new Term({ urlName });
          return (
            <SelectItem item={toUrl(urlName)} key={toUrl(urlName)}>
              {niceName}
            </SelectItem>
          );
        })}
      </SelectContent>
    </SelectRoot>
  );
}
