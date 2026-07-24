import { useContext, useState } from "react";
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

import { HydrantContext } from "../lib/hydrant";
import { BANNER_MESSAGE } from "~/lib/schema";

/** Main banner */
export const AnnouncementsBanner = () => {
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
        {/* Main banner */}
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
  const { state } = useContext(HydrantContext);
  const unknownSubjects = Array.from(state.unknownSubjects);
  const [unknownVisible, setUnknownVisible] = useState(true);

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
          gradientFrom="red.700"
          gradientVia="orange.600"
          gradientTo="yellow.500"
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
