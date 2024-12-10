import { Image, Link } from "@chakra-ui/react";
import sipbLogo from "../assets/fuzzball.png";

export function SIPBLogo() {
  return (
    <Link
      variant="plain"
      href="https://sipb.mit.edu/"
      target="_blank"
      rel="noreferrer"
      fontSize="sm"
      fontWeight="500"
    >
      by SIPB
      <Image src={sipbLogo} alt="SIPB Logo" height="1lh" />
    </Link>
  );
}
