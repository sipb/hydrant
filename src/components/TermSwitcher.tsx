import { useContext } from "react";

import { createListCollection, Portal, Select } from "@chakra-ui/react";

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
    <Select.Root
      collection={urlOptions}
      value={[defaultValue]}
      onValueChange={(e) => {
        window.location.href = e.value[0];
      }}
      size="sm"
      w="9rem"
    >
      <Select.HiddenSelect />
      <Select.Label hidden>Select semester</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {urlOptions.items.map((semester) => {
              return (
                <Select.Item item={semester} key={semester.value}>
                  {semester.label}
                  <Select.ItemIndicator />
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
