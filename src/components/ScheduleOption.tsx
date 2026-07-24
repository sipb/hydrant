import { useContext, useState } from "react";

import { IconButton, Flex, CloseButton } from "@chakra-ui/react";

import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import { HydrantContext } from "../lib/hydrant";
import { Alert } from "./ui/alert";

export function ScheduleOption() {
  const [tooManyOptions, setTooManyOptions] = useState(true);
  const { state, hydrantState } = useContext(HydrantContext);
  const { selectedOption, totalOptions } = hydrantState;

  return (
    <Flex direction="column" align="end" gap={2} mt={-5}>
      <Flex gap={2} alignItems="center">
        <IconButton
          onClick={() => {
            state.selectOption(
              (selectedOption - 1 + totalOptions) % totalOptions,
            );
          }}
          size="xs"
          variant="ghost"
          aria-label="Previous schedule"
        >
          <LuArrowLeft />
        </IconButton>
        {selectedOption + 1} of {totalOptions}
        <IconButton
          onClick={() => {
            state.selectOption(selectedOption + 1);
          }}
          size="xs"
          variant="ghost"
          aria-label="Next schedule"
        >
          <LuArrowRight />
        </IconButton>
      </Flex>
      {tooManyOptions && totalOptions > 15 && (
        <Flex align="center" gap={1} px={2} py={1}>
          <Alert
            size="sm"
            title='Too many options? Use the "Edit sections" button above the class description.'
            colorPalette="gray"
            endElement={
              <CloseButton
                size="sm"
                height={"1rem"}
                onClick={() => {
                  setTooManyOptions(false);
                }}
              />
            }
          />
        </Flex>
      )}
    </Flex>
  );
}
