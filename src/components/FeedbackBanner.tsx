import {
  Center,
  Flex,
  Text,
  Link,
  Box,
  Float,
  IconButton,
  Presence,
} from "@chakra-ui/react";
import { LuX } from "react-icons/lu";

export const FeedbackBanner = (props: {
  isOpen: boolean;
  setOpen: () => void;
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
            <Link
              flexShrink={0}
              variant="plain"
              href={"mailto:sipb-hydrant@mit.edu"}
              ms="6"
              bg="blackAlpha.300"
              color="whiteAlpha.900"
              fontWeight="semibold"
              px="3"
              py="1"
              rounded="l2"
            >
              Contact us
            </Link>
          </Flex>
        </Center>
        <Float placement="middle-end" offset="8">
          <IconButton
            variant="ghost"
            _hover={{ bg: "blackAlpha.300" }}
            onClick={setOpen}
          >
            <LuX />
          </IconButton>
        </Float>
      </Box>
    </Presence>
  );
};
