import { Button, Image } from "@chakra-ui/react";

export function SIPBLogo() {
  return (
    <a
      href="https://sipb.mit.edu/"
      target="_blank"
      rel="noreferrer"
    >
      <Button
        colorScheme="gray"
        rightIcon={
          <Image
            src="/fuzzball.png"
            alt="SIPB Logo"
            height={6}
          />
        }
        size="sm"
      >
        Maintained by SIPB
      </Button>
    </a>
  );
}
