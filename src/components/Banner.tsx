import { useState } from "react";

import {
  Center,
  Flex,
  Text,
  Box,
  Float,
  Presence,
  CloseButton,
  Stack,
} from "@chakra-ui/react";

import { useHydrantContext } from "../lib/hydrant";
import { BANNER_MESSAGE } from "../lib/schema";

/** Main banner */
export const AnnouncementsBanner = () => {
  const { state } = useHydrantContext();
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
        {/* Main banner */}
        <Center
          py="2"
          px="3"
          bgGradient="to-r"
          gradientFrom="hydrant.900"
          gradientTo="hydrant.700"
          color="white"
          textAlign="center"
        >
          <Flex align="center" textStyle="sm">
            <Text fontWeight="medium" maxW={{ base: "32ch", md: "unset" }}>
              {BANNER_MESSAGE}
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

/** Unknown subjects warning, same style as banner */
export const UnknownSubjectsBanner = () => {
  const { state } = useHydrantContext();
  const [unknownVisible, setUnknownVisible] = useState(true);

  const unknownSubjects = Array.from(state.unknownSubjects);

  return (
    <Presence
      present={unknownSubjects.length > 0 && unknownVisible}
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
          gradientFrom="orange.900"
          gradientTo="orange.700"
          color="white"
          textAlign="center"
        >
          <Flex align="center" textStyle="sm">
            <Text fontWeight="medium" maxW={{ base: "32ch", md: "unset" }}>
              Unknown subjects: {unknownSubjects.join(", ")} may not be in
              Hydrant's database.
            </Text>
            <CloseButton
              hideFrom="sm"
              variant="ghost"
              color="whiteAlpha.900"
              _hover={{ bg: "blackAlpha.300" }}
              onClick={() => {
                setUnknownVisible(false);
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
              setUnknownVisible(false);
            }}
          />
        </Float>
      </Box>
    </Presence>
  );
};

export const Banner = () => {
  return (
    <Stack gap={0}>
      <AnnouncementsBanner />
      <UnknownSubjectsBanner />
    </Stack>
  );
};
