import { Center, Flex, Text, Box, Float, Presence } from "@chakra-ui/react";
import { LinkButton } from "./ui/link-button";
import { CloseButton } from "./ui/close-button";

export const FeedbackBanner = (props: {
  isOpen: boolean;
  setOpen: (setBool: boolean) => void;
}) => {
  const { isOpen, setOpen } = props;

  return (
    <Presence
      present={isOpen ?? true}
      animationName={{ _open: "fade-in", _closed: "fade-out" }}
      animationDuration="moderate"
    >
      <Box position="relative">
        <Center
          py="2"
          px="3"
          bgGradient="to-r"
          gradientFrom="cyan.700"
          gradientTo="red.500"
          color="white"
          textAlign="center"
        >
          <Flex align="center" textStyle="sm">
            <Text fontWeight="medium" maxW={{ base: "32ch", md: "unset" }}>
              Do you have feedback on Hydrant? We'd love to hear it!
            </Text>
            <LinkButton
              flexShrink={0}
              variant="plain"
              href={"mailto:sipb-hydrant@mit.edu"}
              ms="6"
              bg="blackAlpha.300"
              color="whiteAlpha.900"
              fontWeight="semibold"
              px="3"
              py="1"
              height="inherit"
            >
              Contact us
            </LinkButton>
            <CloseButton
              hideFrom="sm"
              variant="ghost"
              color="whiteAlpha.900"
              _hover={{ bg: "blackAlpha.300" }}
              onClick={() => setOpen(false)}
            />
          </Flex>
        </Center>
        <Float placement="middle-end" offset="8" hideBelow="sm">
          <CloseButton
            variant="ghost"
            color="whiteAlpha.900"
            _hover={{ bg: "blackAlpha.300" }}
            onClick={() => setOpen(false)}
          />
        </Float>
      </Box>
    </Presence>
  );
};
