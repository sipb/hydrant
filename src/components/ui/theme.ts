import { createSystem, defaultConfig } from "@chakra-ui/react";

/**
 * hydrant blue, based on logo
 */
const hydrant = {
  50: { value: "#EDF8FE" },
  100: { value: "#D5EEFD" },
  200: { value: "#ADDCF9" },
  300: { value: "#7BC6F3" },
  400: { value: "#45AEE9" },
  500: { value: "#1499E1" },
  600: { value: "#0E82C2" },
  700: { value: "#0A6DA6" },
  800: { value: "#0C5580" },
  900: { value: "#0E445F" },
  950: { value: "#082B3F" },
};

/**
 * blue-leaning neutral palette
 */
const slate = {
  50: { value: "#F8FAFC" },
  100: { value: "#F1F5F9" },
  200: { value: "#E2E8F0" },
  300: { value: "#CBD5E1" },
  400: { value: "#94A3B8" },
  500: { value: "#64748B" },
  600: { value: "#475569" },
  700: { value: "#334155" },
  800: { value: "#1E293B" },
  900: { value: "#0F172A" },
  950: { value: "#020617" },
};

/**
 * red in a cooler tone
 */
const rose = {
  50: { value: "#FFF1F2" },
  100: { value: "#FFE4E6" },
  200: { value: "#FECDD3" },
  300: { value: "#FDA4AF" },
  400: { value: "#FB7185" },
  500: { value: "#F43F5E" },
  600: { value: "#E11D48" },
  700: { value: "#BE123C" },
  800: { value: "#9F1239" },
  900: { value: "#881337" },
  950: { value: "#4C0519" },
};

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      // hydrant palette is default
      colorPalette: "hydrant",
    },
    body: {
      bg: "bg",
      color: "fg",
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'IBM Plex Sans Variable', sans-serif` },
        body: { value: `'IBM Plex Sans Variable', sans-serif` },
        mono: { value: `'IBM Plex Mono', ui-monospace, monospace` },
      },
      colors: {
        hydrant,
        gray: slate,
        red: rose,
      },
      shadows: {
        // shadows a bit tinted instead of pure black
        xs: { value: "0 1px 2px 0 rgba(15, 23, 42, 0.06)" },
        sm: {
          value:
            "0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.07)",
        },
        md: {
          value:
            "0 2px 4px -1px rgba(15, 23, 42, 0.05), 0 6px 16px -2px rgba(15, 23, 42, 0.09)",
        },
        lg: {
          value:
            "0 4px 8px -2px rgba(15, 23, 42, 0.05), 0 12px 28px -4px rgba(15, 23, 42, 0.12)",
        },
        xl: {
          value:
            "0 8px 16px -4px rgba(15, 23, 42, 0.06), 0 24px 48px -8px rgba(15, 23, 42, 0.16)",
        },
      },
    },
    semanticTokens: {
      radii: {
        // a bit softer
        l1: { value: "6px" },
        l2: { value: "10px" },
        l3: { value: "14px" },
      },
      colors: {
        // makes `colorPalette="hydrant"` work
        hydrant: {
          contrast: {
            value: { _light: "white", _dark: "{colors.hydrant.950}" },
          },
          fg: {
            value: {
              _light: "{colors.hydrant.700}",
              _dark: "{colors.hydrant.300}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.hydrant.50}",
              _dark: "{colors.hydrant.950}",
            },
          },
          muted: {
            value: {
              _light: "{colors.hydrant.100}",
              _dark: "{colors.hydrant.900}",
            },
          },
          emphasized: {
            value: {
              _light: "{colors.hydrant.200}",
              _dark: "{colors.hydrant.800}",
            },
          },
          solid: {
            value: {
              _light: "{colors.hydrant.700}",
              _dark: "{colors.hydrant.400}",
            },
          },
          focusRing: {
            value: {
              _light: "{colors.hydrant.500}",
              _dark: "{colors.hydrant.400}",
            },
          },
          // this one is important for outline buttons
          border: {
            value: {
              _light: "{colors.hydrant.500}",
              _dark: "{colors.hydrant.400}",
            },
          },
        },
        bg: {
          DEFAULT: {
            value: { _light: "{colors.gray.50}", _dark: "{colors.gray.950}" },
          },
          panel: {
            value: { _light: "white", _dark: "{colors.gray.900}" },
          },
          subtle: {
            value: { _light: "{colors.gray.100}", _dark: "{colors.gray.900}" },
          },
          muted: {
            value: { _light: "{colors.gray.200}", _dark: "{colors.gray.800}" },
          },
          emphasized: {
            value: { _light: "{colors.gray.300}", _dark: "{colors.gray.700}" },
          },
        },
        fg: {
          DEFAULT: {
            value: { _light: "{colors.gray.900}", _dark: "{colors.gray.100}" },
          },
          muted: {
            value: { _light: "{colors.gray.600}", _dark: "{colors.gray.400}" },
          },
          subtle: {
            value: { _light: "{colors.gray.500}", _dark: "{colors.gray.500}" },
          },
        },
        border: {
          DEFAULT: {
            value: { _light: "{colors.gray.200}", _dark: "{colors.gray.800}" },
          },
          muted: {
            value: { _light: "{colors.gray.100}", _dark: "{colors.gray.900}" },
          },
          emphasized: {
            value: { _light: "{colors.gray.300}", _dark: "{colors.gray.700}" },
          },
        },
      },
    },
    textStyles: {
      data: {
        value: {
          fontFamily: "mono",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        },
      },
    },
    recipes: {
      button: {
        base: {
          fontWeight: "semibold",
          letterSpacing: "-0.005em",
        },
        variants: {
          variant: {
            solid: {
              _active: { bg: "colorPalette.solid!" },
            },
            subtle: {
              _active: { bg: "colorPalette.emphasized!" },
            },
            surface: {
              _active: { bg: "colorPalette.emphasized!" },
            },
            outline: {
              _hover: {
                bg: {
                  _light: "colorPalette.subtle",
                  _dark: "colorPalette.muted",
                },
              },
              _active: {
                bg: {
                  _light: "colorPalette.muted!",
                  _dark: "colorPalette.emphasized!",
                },
              },
            },
            ghost: {
              _hover: {
                bg: {
                  _light: "colorPalette.subtle",
                  _dark: "colorPalette.muted",
                },
              },
              _active: {
                bg: {
                  _light: "colorPalette.muted!",
                  _dark: "colorPalette.emphasized!",
                },
              },
            },
          },
        },
        defaultVariants: {
          variant: "subtle",
        },
      },
      heading: {
        base: {
          letterSpacing: "-0.02em",
        },
      },
    },
  },
});
