import { Flex, Link, Text } from "@chakra-ui/react";
import { useState } from "react";

import {
  DialogRoot,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

import { State } from "../lib/state";

function AboutDialog() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Link onClick={() => setVisible(true)} colorPalette="blue">
        About
      </Link>
      <DialogRoot open={visible} onOpenChange={() => setVisible(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hydrant</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <Text>
                Hydrant is a student-run class planner for MIT students,
                maintained by SIPB, the{" "}
                <Link href="https://sipb.mit.edu/" colorPalette="blue">
                  Student Information Processing Board
                </Link>
                .
              </Text>
              <Text>
                We welcome contributions! View the source code or file issues on{" "}
                <Link
                  href="https://github.com/sipb/hydrant"
                  colorPalette="blue"
                >
                  Github
                </Link>
                , or come to a SIPB meeting and ask how to help.
              </Text>
              <Text>
                We'd like to thank Edward Fan for creating{" "}
                <Link href="https://firehose.guide/" colorPalette="blue">
                  Firehose
                </Link>
                , the basis for Hydrant, and the{" "}
                <Link href="https://fireroad.mit.edu/" colorPalette="blue">
                  FireRoad
                </Link>{" "}
                team for collaborating with us.
              </Text>
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setVisible(false)} variant="subtle">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

/** The footer on the bottom of the calendar. */
export function LeftFooter(props: { state: State }) {
  const { state } = props;

  return (
    <Flex direction="column" align="center" gap={2}>
      <Text>Last updated: {state.lastUpdated}.</Text>
      <Flex gap={4}>
        <AboutDialog />
        <Link href="mailto:sipb-hydrant@mit.edu" colorPalette="blue">
          Contact
        </Link>
        <Link href="privacy.html" colorPalette="blue">
          Privacy Policy
        </Link>
      </Flex>
    </Flex>
  );
}
