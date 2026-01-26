import { useContext, useState } from "react";

import {
  Flex,
  Link as ChakraLink,
  Text,
  Button,
  Image,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { Link } from "react-router";

import fuzzAndAnt from "../assets/fuzzAndAnt.png";
import { HydrantContext } from "../lib/hydrant";

function AboutDialog() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Dialog.Root
        lazyMount
        open={visible}
        onOpenChange={(e) => {
          setVisible(e.open);
        }}
      >
        <Dialog.Trigger asChild>
          <ChakraLink colorPalette="blue">About</ChakraLink>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Hydrant</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Flex direction="column" gap={4}>
                  <Text>
                    Hydrant is a student-run class planner for MIT students,
                    maintained by SIPB, the{" "}
                    <ChakraLink colorPalette="blue" asChild>
                      <Link
                        to="https://sipb.mit.edu/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Student Information Processing Board
                      </Link>
                    </ChakraLink>
                    .
                  </Text>
                  <Text>
                    We welcome contributions! View the source code or file
                    issues on{" "}
                    <ChakraLink colorPalette="blue" asChild>
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        to="https://github.com/sipb/hydrant"
                      >
                        GitHub
                      </Link>
                    </ChakraLink>
                    , or come to a SIPB meeting and ask how to help.
                  </Text>
                  <Text>
                    We'd like to thank CJ Quines '23 for creating Hydrant and
                    Edward Fan '19 for creating{" "}
                    <ChakraLink colorPalette="blue" asChild>
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        to="https://firehose.guide/"
                      >
                        Firehose
                      </Link>
                    </ChakraLink>
                    , the basis for Hydrant. We'd also like to thank the{" "}
                    <ChakraLink colorPalette="blue" asChild>
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        to="https://fireroad.mit.edu/"
                      >
                        FireRoad
                      </Link>
                    </ChakraLink>{" "}
                    team and{" "}
                    <ChakraLink colorPalette="blue" asChild>
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        to="https://physicaleducationandwellness.mit.edu/"
                      >
                        DAPER
                      </Link>
                    </ChakraLink>{" "}
                    for collaborating with us.
                  </Text>
                </Flex>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button>Close</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

function PrivacyPolicyDialog() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Dialog.Root
        open={visible}
        onOpenChange={(e) => {
          setVisible(e.open);
        }}
      >
        <Dialog.Trigger asChild>
          <ChakraLink colorPalette="blue">Privacy Policy</ChakraLink>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Privacy Policy</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Flex direction="column" gap={4}>
                  <Text>
                    Hydrant does not store any of your data outside of your
                    browser. Data is only transmitted upstream when you export
                    to Google Calendar. When you export to Google Calendar,
                    Hydrant sends calendar information to Google to place into
                    your calendar.
                  </Text>
                  <Text>
                    No data is transmitted otherwise. That means that our
                    servers do not store your class or calendar information. If
                    you never export to Google Calendar we never send your data
                    anywhere else.
                  </Text>
                </Flex>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button>Close</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

/** The footer on the bottom of the calendar. */
export function LeftFooter() {
  const { state } = useContext(HydrantContext);

  return (
    <Flex direction="row" align="center" justify="center" gap={5}>
      <Image
        src={fuzzAndAnt}
        alt="Hydra ant and fuzzball stare at a calendar"
        h="70px"
        pos="relative"
        top={-1.5}
      />
      <Flex direction="column" align="center" gap={2}>
        <Text>Last updated: {state.lastUpdated}.</Text>
        <Flex gap={4} wrap="wrap">
          <AboutDialog />
          <ChakraLink colorPalette="blue" asChild>
            <Link to="mailto:sipb-hydrant@mit.edu">Contact</Link>
          </ChakraLink>
          <PrivacyPolicyDialog />
          <ChakraLink colorPalette="blue" asChild>
            <Link to="https://accessibility.mit.edu/">Accessibility</Link>
          </ChakraLink>
        </Flex>
      </Flex>
    </Flex>
  );
}
