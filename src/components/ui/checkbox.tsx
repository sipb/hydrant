import { Checkbox as ChakraCheckbox } from "@chakra-ui/react";
import type { ReactNode, InputHTMLAttributes, Ref } from "react";
import { forwardRef } from "react";

export interface CheckboxProps extends ChakraCheckbox.RootProps {
  icon?: ReactNode;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  rootRef?: Ref<HTMLLabelElement>;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(props, ref) {
    const { icon, children, inputProps, rootRef, ...rest } = props;
    return (
      <ChakraCheckbox.Root ref={rootRef} {...rest}>
        <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
        <ChakraCheckbox.Control>
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          {icon || <ChakraCheckbox.Indicator />}
        </ChakraCheckbox.Control>
        {children != null && (
          <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>
        )}
      </ChakraCheckbox.Root>
    );
  },
);
