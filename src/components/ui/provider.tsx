"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Inter Variable', sans-serif` },
        body: { value: `'Inter Variable', sans-serif` },
      },
    },
    semanticTokens: {
      radii: {
        l1: { value: "{radii.sm}" },
        l2: { value: "{radii.md}" },
        l3: { value: "{radii.lg}" },
      },
    },
    recipes: {
      button: {
        defaultVariants: {
          // @ts-expect-error: this works I promise :(
          variant: "subtle",
          fontweight: "semibold",
        },
      },
    },
  },
});

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
