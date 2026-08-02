import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'IBM Plex Sans Variable', sans-serif` },
        body: { value: `'IBM Plex Sans Variable', sans-serif` },
        mono: { value: `'IBM Plex Mono', ui-monospace, monospace` },
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
        base: {
          fontWeight: "semibold",
        },
        defaultVariants: {
          variant: "subtle",
        },
      },
    },
  },
});
