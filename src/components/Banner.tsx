import { useContext } from "react";

import {
  Center,
  Flex,
  Text,
  Box,
  Float,
  Presence,
  CloseButton,
} from "@chakra-ui/react";

import { HydrantContext } from "../lib/hydrant";

export const Banner = () => {
  const { state } = useContext(HydrantContext);

  return (
    <Presence
      present={state.showBanner}
      animationName={{
        _open: "slide-from-top-full",
        _closed: "slide-to-top-full",
      }}
      animationDuration="moderate"
    >
      <Box position="relative">
        <Center
          py="2"
          px="3"
          bgGradient="to-r"
          gradientFrom="cyan.700"
          gradientVia="purple.600"
          gradientTo="red.500"
          color="white"
          textAlign="center"
        >
          <Flex align="center" textStyle="sm">
            <Text fontWeight="medium" maxW={{ base: "32ch", md: "unset" }}>
              Q3 Physical Education and Wellness classes are now available on
              Hydrant! Registration opens Jan 30 on the PE&W website.
            </Text>
            <CloseButton
              hideFrom="sm"
              variant="ghost"
              color="whiteAlpha.900"
              _hover={{ bg: "blackAlpha.300" }}
              onClick={() => {
                state.showBanner = false;
              }}
            />
          </Flex>
        </Center>
        <Float placement="middle-end" offset="8" hideBelow="sm">
          <CloseButton
            variant="ghost"
            color="whiteAlpha.900"
            _hover={{ bg: "blackAlpha.300" }}
            onClick={() => {
              state.showBanner = false;
            }}
          />
        </Float>
      </Box>
    </Presence>
  );
};
