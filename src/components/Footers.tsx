import { useState } from "react";

import {
  Flex,
  Link,
  Text,
  Button,
  Image,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";

import { useHydrantContext } from "../lib/hydrant";

import fuzzAndAnt from "../assets/fuzzAndAnt.png";

function AboutDialog() {
  const [visible, setVisible] = useState(false);

  return (
    <Dialog.Root
      lazyMount
      open={visible}
      onOpenChange={(e) => {
        setVisible(e.open);
      }}
    >
      <Dialog.Trigger asChild>
        <Link as="button">About</Link>
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
                  <Link asChild>
                    <RouterLink
                      to="https://sipb.mit.edu/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Student Information Processing Board
                    </RouterLink>
                  </Link>
                  .
                </Text>
                <Text>
                  We welcome contributions! View the source code or file issues
                  on{" "}
                  <Link asChild>
                    <RouterLink
                      target="_blank"
                      rel="noreferrer"
                      to="https://github.com/sipb/hydrant"
                    >
                      GitHub
                    </RouterLink>
                  </Link>
                  , or come to a SIPB meeting and ask how to help.
                </Text>
                <Text>
                  We'd like to thank CJ Quines '23 for creating Hydrant and
                  Edward Fan '19 for creating{" "}
                  <Link asChild>
                    <RouterLink
                      target="_blank"
                      rel="noreferrer"
                      to="https://firehose.guide/"
                    >
                      Firehose
                    </RouterLink>
                  </Link>
                  , the basis for Hydrant. We'd also like to thank the{" "}
                  <Link asChild>
                    <RouterLink
                      target="_blank"
                      rel="noreferrer"
                      to="https://fireroad.mit.edu/"
                    >
                      FireRoad
                    </RouterLink>
                  </Link>{" "}
                  team and{" "}
                  <Link asChild>
                    <RouterLink
                      target="_blank"
                      rel="noreferrer"
                      to="https://physicaleducationandwellness.mit.edu/"
                    >
                      DAPER
                    </RouterLink>
                  </Link>{" "}
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
  );
}

function PrivacyPolicyDialog() {
  const [visible, setVisible] = useState(false);

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(e) => {
        setVisible(e.open);
      }}
    >
      <Dialog.Trigger asChild>
        <Link as="button">Privacy Policy</Link>
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
                  SIPB self-hosts an open-source analytics platform called{" "}
                  <Link asChild>
                    <RouterLink
                      target="_blank"
                      rel="noreferrer"
                      to="https://plausible.io/"
                    >
                      Plausible Analytics
                    </RouterLink>
                  </Link>{" "}
                  to track usage of Hydrant. A{" "}
                  <Link asChild>
                    <RouterLink
                      target="_blank"
                      rel="noreferrer"
                      to="https://plausible.io/data-policy"
                    >
                      limited amount of information
                    </RouterLink>
                  </Link>
                  , including page URLs, HTTP Referer strings, browser and
                  operating system information, device type, and what city you
                  are in, is sent anonymously for analytics purposes. No
                  personally identifiable information is ever collected or
                  stored, and none of this information ever leaves SIPB.
                </Text>
                <Text>
                  No data is transmitted otherwise. That means that our servers
                  do not store your class or calendar information, and all data
                  stays on your device. If you never export your class data,
                  such as to Matrix, we never send your data anywhere else.
                </Text>
                <Text>
                  We do not, and will never, share any user data with third
                  parties without your explicit consent.
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
  );
}

function LicenseDialog() {
  const [visible, setVisible] = useState(false);

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(e) => {
        setVisible(e.open);
      }}
    >
      <Dialog.Trigger asChild>
        <Link as="button">Terms of Use</Link>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Terms of Use</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Flex direction="column" gap={4}>
                <Text>
                  Hydrant is created and maintained by the MIT Student
                  Information Processing Board (SIPB) with the help of student
                  volunteers.
                </Text>
                <Text>
                  By using Hydrant, both for your own personal purposes or for
                  your own software development, you agree that any software
                  created using any element of Hydrant will be and shall forever
                  remain open-source and free (as in freedom) for any purpose.
                </Text>
                <Text>
                  See the{" "}
                  <Link asChild>
                    <RouterLink
                      target="_blank"
                      rel="noreferrer"
                      to="https://github.com/sipb/hydrant#license"
                    >
                      official license
                    </RouterLink>
                  </Link>{" "}
                  on GitHub, and reach out to us if you have any questions!
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
  );
}

/** The footer on the bottom of the calendar. */
export function LeftFooter() {
  const { state } = useHydrantContext();
  const updateTime = Temporal.PlainDateTime.from(state.lastUpdated)
    .toZonedDateTime("UTC")
    .toInstant();

  return (
    <Flex as="footer" direction="row" align="center" justify="center" gap={5}>
      <Image
        src={fuzzAndAnt}
        alt="Hydra ant and fuzzball stare at a calendar"
        h="70px"
        pos="relative"
        top={-1.5}
      />
      <Flex direction="column" align="center" gap={2}>
        <Text textAlign="center" fontSize="sm" color="fg.muted">
          Last updated:{" "}
          <time dateTime={updateTime.toString()}>
            {updateTime.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        </Text>
        <Flex gap={4} wrap="wrap" align="center" justify="center">
          <AboutDialog />
          <Link asChild>
            <RouterLink to="mailto:sipb-hydrant@mit.edu">Contact</RouterLink>
          </Link>
          <PrivacyPolicyDialog />
          <LicenseDialog />
          <Link asChild>
            <RouterLink to="https://accessibility.mit.edu/">
              Accessibility
            </RouterLink>
          </Link>
        </Flex>
      </Flex>
    </Flex>
  );
}
