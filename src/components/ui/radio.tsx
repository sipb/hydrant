import { RadioGroup as ChakraRadioGroup } from "@chakra-ui/react";
import type { Ref, InputHTMLAttributes } from "react";
import { forwardRef } from "react";

export interface RadioProps extends ChakraRadioGroup.ItemProps {
  rootRef?: Ref<HTMLDivElement>;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  function Radio(props, ref) {
    const { children, inputProps, rootRef, ...rest } = props;
    return (
      <ChakraRadioGroup.Item ref={rootRef} {...rest}>
        <ChakraRadioGroup.ItemHiddenInput ref={ref} {...inputProps} />
        <ChakraRadioGroup.ItemIndicator />
        {children && (
          <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>
        )}
      </ChakraRadioGroup.Item>
    );
  },
);

export const RadioGroup = ChakraRadioGroup.Root;
