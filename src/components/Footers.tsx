import { Flex, Link, Text, Button } from "@chakra-ui/react";
import { useState } from "react";

import {
  DialogRoot,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogActionTrigger,
} from "./ui/dialog";

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
                  GitHub
                </Link>
                , or come to a SIPB meeting and ask how to help.
              </Text>
              <Text>
                We'd like to thank CJ Quines '23 for creating Hydrant and Edward
                Fan '19 for creating{" "}
                <Link href="https://firehose.guide/" colorPalette="blue">
                  Firehose
                </Link>
                , the basis for Hydrant. We'd also like to thank the{" "}
                <Link href="https://fireroad.mit.edu/" colorPalette="blue">
                  FireRoad
                </Link>{" "}
                team for collaborating with us.
              </Text>
            </Flex>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button>Close</Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

function PrivacyPolicyDialog() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Link onClick={() => setVisible(true)} colorPalette="blue">
        Privacy Policy
      </Link>
      <DialogRoot open={visible} onOpenChange={() => setVisible(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <Text>
                Hydrant does not store any of your data outside of your browser.
                Data is only transmitted upstream when you export to Google
                Calendar. When you export to Google Calendar, Hydrant sends
                calendar information to Google to place into your calendar.
              </Text>
              <Text>
                No data is transmitted otherwise. That means that our servers do
                not store your class or calendar information. If you never
                export to Google Calendar we never send your data anywhere else.
              </Text>
            </Flex>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button>Close</Button>
            </DialogActionTrigger>
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
        <PrivacyPolicyDialog />
      </Flex>
    </Flex>
  );
}
