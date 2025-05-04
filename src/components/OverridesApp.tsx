import { Flex, Heading, Image } from "@chakra-ui/react";

import { Provider } from "./ui/provider";

import logo from "../assets/logo.svg";

/** The main application. */
export default function App() {
  return (
    <Provider>
      <Flex direction="column" gap={5} px="20%" py={4}>
        <Flex>
          <Image
            src={logo}
            alt="Hydrant logo"
            h="40px"
            pos="relative"
            top={2}
          />
        </Flex>
        <Heading>Submit Overrides</Heading>
      </Flex>
    </Provider>
  );
}
