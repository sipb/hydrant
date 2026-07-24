import { Alert as ChakraAlert } from "@chakra-ui/react";
import { forwardRef, type ReactNode, type ReactElement } from "react";

export interface AlertProps extends Omit<ChakraAlert.RootProps, "title"> {
  startElement?: ReactNode;
  endElement?: ReactNode;
  title?: ReactNode;
  icon?: ReactElement;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    const { title, children, icon, startElement, endElement, ...rest } = props;
    return (
      <ChakraAlert.Root ref={ref} {...rest}>
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
        {startElement || <ChakraAlert.Indicator>{icon}</ChakraAlert.Indicator>}
        {children ? (
          <ChakraAlert.Content>
            <ChakraAlert.Title>{title}</ChakraAlert.Title>
            <ChakraAlert.Description>{children}</ChakraAlert.Description>
          </ChakraAlert.Content>
        ) : (
          <ChakraAlert.Title flex="1">{title}</ChakraAlert.Title>
        )}
        {endElement}
      </ChakraAlert.Root>
    );
  },
);
