import { useContext, useState } from "react";

import { IconButton, Flex, Text, CloseButton } from "@chakra-ui/react";

import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import { HydrantContext } from "../lib/hydrant";

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
        <Flex align="center" bg="whiteAlpha.50" gap={1} px={2} py={1}>
          <Text fontSize="sm">
            Too many options? Use the "Edit sections" button above the class
            description.
          </Text>
          <CloseButton
            size="sm"
            onClick={() => {
              setTooManyOptions(false);
            }}
          />
        </Flex>
      )}
    </Flex>
  );
}
