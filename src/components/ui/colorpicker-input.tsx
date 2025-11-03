import {
  ColorPicker,
  parseColor,
  useColorPickerContext,
} from "@chakra-ui/react";
import { forwardRef } from "react";

export const ColorPickerInput = forwardRef<
  HTMLInputElement,
  Omit<ColorPicker.ChannelInputProps, "channel">
>(function ColorHexInput(props, ref) {
  const { setValue } = useColorPickerContext();

  return (
    <ColorPicker.ChannelInput
      onChange={(e) => {
        const input = e.target.value;
        if (
          input.length === 6 ||
          (input.length === 7 && input.startsWith("#"))
        ) {
          // parseColor will throw if the value is not a valid hex color
          try {
            let caretPositionBefore = e.target.selectionStart;
            let colorToParse = input;
            if (!colorToParse.startsWith("#")) {
              colorToParse = `#${colorToParse}`;
              caretPositionBefore = caretPositionBefore
                ? caretPositionBefore + 1
                : caretPositionBefore;
            }
            setValue(parseColor(colorToParse));
            setTimeout(() => {
              try {
                e.target.setSelectionRange(
                  caretPositionBefore,
                  caretPositionBefore,
                );
              } catch (error) {
                console.error("Error setting selection range:", error);
              }
            }, 0);
          } catch {
            return;
          }
        }
      }}
      channel="hex"
      ref={ref}
      {...props}
    />
  );
});
