import { Field as ChakraField } from "@chakra-ui/react";
import { type ReactNode, forwardRef } from "react";

export interface FieldProps extends Omit<ChakraField.RootProps, "label"> {
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  optionalText?: ReactNode;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  function Field(props, ref) {
    const { label, children, helperText, errorText, optionalText, ...rest } =
      props;
    return (
      <ChakraField.Root ref={ref} {...rest}>
        {label && (
          <ChakraField.Label>
            {label}
            <ChakraField.RequiredIndicator fallback={optionalText} />
          </ChakraField.Label>
        )}
        {children}
        {helperText && (
          <ChakraField.HelperText>{helperText}</ChakraField.HelperText>
        )}
        {errorText && (
          <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>
        )}
      </ChakraField.Root>
    );
  },
);
