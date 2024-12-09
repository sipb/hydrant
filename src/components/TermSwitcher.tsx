import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./ui/select";

import { createListCollection } from "@chakra-ui/react";

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
  if (semester === "f") {
    return `s${year}`;
  } else if (semester === "s") {
    return `i${year}`;
  } else {
    return `f${parseInt(year, 10) - 1}`;
  }
}

/** urlNames that don't have a State */
const EXCLUDED_URLS = ["i23", "i24", "i25"];

/** Earliest urlName we have a State for. */
const EARLIEST_URL = "f22";

/** Return all urlNames before the given one. */
function getUrlNames(latestTerm: string): Array<string> {
  let urlName = latestTerm;
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
  const toUrl = (urlName: string) =>
    toFullUrl(urlName, state.latestTerm.urlName);
  const defaultValue = toUrl(state.term.urlName);

  return (
    <SelectRoot
      collection={createListCollection({
        items: getUrlNames(state.latestTerm.urlName).map((urlName) => {
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
        {getUrlNames(state.latestTerm.urlName).map((urlName) => {
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
