import { Flex, Heading, Image } from "@chakra-ui/react";
import { JsonForms } from "@jsonforms/react";
import { materialCells, materialRenderers } from "@jsonforms/material-renderers";

import { Provider } from "./ui/provider";

import logo from "../assets/logo.svg";
import schema from "../../scrapers/overrides.toml.d/override-schema.json";

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
        <JsonForms
          schema={schema}
          renderers={materialRenderers}
          cells={materialCells}
        />
      </Flex>
    </Provider>
  );
}
