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
import { Term, toFullUrl, getUrlNames } from "../lib/dates";

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
