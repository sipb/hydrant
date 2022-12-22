import { Button, CloseButton, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";

import { State } from "../lib/state";

export function ScheduleOption(props: {
  selectedOption: number;
  totalOptions: number;
  state: State;
}) {
  const { selectedOption, totalOptions, state } = props;
  const [tooManyOptions, setTooManyOptions] = useState(true);

  return (
    <Flex direction="column" align="end" gap={2} mt={-5}>
      <Flex gap={2}>
        <Button
          onClick={() => state.selectOption((selectedOption - 1 + totalOptions) % totalOptions)}
          size="xs"
        >
          &larr;
        </Button>{" "}
        {selectedOption + 1} of {totalOptions}
        <Button
          onClick={() => state.selectOption(selectedOption + 1)}
          size="xs"
        >
          &rarr;
        </Button>
      </Flex>
      {tooManyOptions && totalOptions > 15 && (
        <Flex
          align="center"
          bg="whiteAlpha.50"
          gap={1}
          px={2}
          py={1}
        >
          <Text fontSize="sm">
            Too many options? Use the "Edit sections" button above the class
            description.
          </Text>
          <CloseButton size="sm" onClick={() => setTooManyOptions(false)} />
        </Flex>
      )}
    </Flex>
  );
}
