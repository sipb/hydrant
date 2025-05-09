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
  const { hydrant: state } = useContext(HydrantContext);

  if (!state) {
    throw new Error("Hydrant context is undefined");
  }
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
