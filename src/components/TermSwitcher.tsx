import { useContext } from "react";

import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "./ui/select";
import { createListCollection } from "@chakra-ui/react";

import { Term, toFullUrl, getUrlNames } from "../lib/dates";
import { HydrantContext } from "../lib/hydrant";

export function TermSwitcher() {
  const { state } = useContext(HydrantContext);
  const toUrl = (urlName: string) => toFullUrl(urlName, state.latestUrlName);
  const defaultValue = toUrl(state.term.urlName);

  const urlOptions = createListCollection({
    items: getUrlNames(state.latestUrlName).map((urlName) => {
      const { niceName } = new Term({ urlName });
      return {
        label: niceName,
        value: toUrl(urlName),
      };
    }),
  });

  return (
    <SelectRoot
      collection={urlOptions}
      value={[defaultValue]}
      onValueChange={(e) => {
        window.location.href = e.value[0];
      }}
      size="sm"
      w="9rem"
    >
      <SelectLabel hidden>Select semester</SelectLabel>
      <SelectTrigger>
        <SelectValueText />
      </SelectTrigger>
      <SelectContent>
        {urlOptions.items.map(({ label, value }) => {
          return (
            <SelectItem item={value} key={value}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </SelectRoot>
  );
}
