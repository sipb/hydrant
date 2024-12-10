import { Flex, Image, Link, LinkBox, LinkOverlay } from "@chakra-ui/react";
import sipbLogo from "../assets/fuzzball.png";

export function SIPBLogo() {
  return (
    <LinkBox>
      <Flex direction="row" gap={2}>
        <LinkOverlay asChild>
          <Link
            variant="subtle"
            href="https://sipb.mit.edu/"
            target="_blank"
            rel="noreferrer"
            fontSize="sm"
            fontWeight="500"
          >
            by SIPB
          </Link>
        </LinkOverlay>
        <Image src={sipbLogo} alt="SIPB Logo" height="1lh" />
      </Flex>
    </LinkBox>
  );
}
