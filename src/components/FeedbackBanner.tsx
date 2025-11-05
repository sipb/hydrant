import { useContext } from "react";

import {
  Center,
  Flex,
  Text,
  Box,
  Float,
  Presence,
  CloseButton,
  Button,
} from "@chakra-ui/react";

import { HydrantContext } from "../lib/hydrant";
import { Link } from "react-router";

export const FeedbackBanner = () => {
  const { state } = useContext(HydrantContext);

  return (
    <Presence
      present={state.showFeedback}
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
              Do you have feedback on Hydrant? We'd love to hear it!
            </Text>
            <Button
              flexShrink={0}
              variant="plain"
              ms="6"
              bg="blackAlpha.300"
              color="whiteAlpha.900"
              fontWeight="semibold"
              px="3"
              py="1"
              height="inherit"
              asChild
            >
              <Link to={"mailto:sipb-hydrant@mit.edu"}>Contact us</Link>
            </Button>
            <CloseButton
              hideFrom="sm"
              variant="ghost"
              color="whiteAlpha.900"
              _hover={{ bg: "blackAlpha.300" }}
              onClick={() => {
                state.showFeedback = false;
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
              state.showFeedback = false;
            }}
          />
        </Float>
      </Box>
    </Presence>
  );
};
