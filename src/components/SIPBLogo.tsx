import { Image } from "@chakra-ui/react";
import { LinkButton } from "./ui/link-button";

export function SIPBLogo() {
  return (
    <LinkButton
      colorPalette="gray"
      size="sm"
      variant="subtle"
      href="https://sipb.mit.edu/"
      target="_blank"
      rel="noreferrer"
    >
      Maintained by SIPB
      <Image src="/fuzzball.png" alt="SIPB Logo" height="1lh" />
    </LinkButton>
  );
}
