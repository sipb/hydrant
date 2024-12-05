import { Image } from "@chakra-ui/react";
import { LinkButton } from "./ui/link-button";
import sipbLogo from "../assets/fuzzball.png";

export function SIPBLogo() {
  return (
    <LinkButton
      colorPalette="gray"
      size="sm"
      variant="subtle"
      href="https://sipb.mit.edu/"
      target="_blank"
      rel="noreferrer"
      fontWeight={"semibold"}
    >
      Maintained by SIPB
      <Image src={sipbLogo} alt="SIPB Logo" height="1.25lh" />
    </LinkButton>
  );
}
