import {
  Button,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

import { State } from "../lib/state";

function AboutModal() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Link onClick={() => setVisible(true)}>About</Link>
      <Modal isOpen={visible} onClose={() => setVisible(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Hydrant</ModalHeader>
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Text>
                Hydrant is a student-run class planner for MIT students,
                maintained by SIPB, the{" "}
                <Link href="https://sipb.mit.edu/">
                  Student Information Processing Board
                </Link>
                .
              </Text>
              <Text>
                We welcome contributions! View the source code or file issues on{" "}
                <Link href="https://github.com/sipb/hydrant">Github</Link>, or
                come to a SIPB meeting and ask how to help.
              </Text>
              <Text>
                We'd like to thank Edward Fan for creating{" "}
                <Link href="https://firehose.guide/">Firehose</Link>, the basis
                for Hydrant, and the{" "}
                <Link href="https://fireroad.mit.edu/">FireRoad</Link> team for
                collaborating with us.
              </Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setVisible(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
        <AboutModal />
        <Link href="mailto:sipb-hydrant@mit.edu">Contact</Link>
        <Link href="privacy.html">Privacy Policy</Link>
      </Flex>
    </Flex>
  );
}
