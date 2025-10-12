import { Image, Link as ChakraLink } from "@chakra-ui/react";
import { Link } from "react-router";
import sipbLogo from "../assets/simple-fuzzball.png";

export function SIPBLogo() {
  return (
    <ChakraLink variant="plain" fontSize="sm" fontWeight="500" asChild>
      <Link to="https://sipb.mit.edu/" target="_blank" rel="noreferrer">
        by SIPB
        <Image src={sipbLogo} alt="SIPB Logo" height="1lh" />
      </Link>
    </ChakraLink>
  );
}
