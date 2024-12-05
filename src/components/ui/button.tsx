import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import {
  AbsoluteCenter,
  Button as ChakraButton,
  Span,
  Spinner,
  Tooltip as ChakraTooltip,
} from "@chakra-ui/react";
import * as React from "react";
import { Tooltip } from "./tooltip";

interface ButtonLoadingProps {
  loading?: boolean;
  loadingText?: React.ReactNode;
}

export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const { loading, disabled, loadingText, children, variant, ...rest } =
      props;
    return (
      <ChakraButton
        disabled={loading || disabled}
        ref={ref}
        variant={variant ?? "subtle"}
        fontWeight={"semibold"}
        {...rest}
      >
        {loading && !loadingText ? (
          <>
            <AbsoluteCenter display="inline-flex">
              <Spinner size="inherit" color="inherit" />
            </AbsoluteCenter>
            <Span opacity={0}>{children}</Span>
          </>
        ) : loading && loadingText ? (
          <>
            <Spinner size="inherit" color="inherit" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </ChakraButton>
    );
  },
);

export interface LabelledButtonProps extends ButtonProps {
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  titleProps?: ChakraTooltip.ContentProps;
  disabled?: boolean;
}

export const LabelledButton = (props: LabelledButtonProps) => {
  const { showArrow, title, titleProps, portalled, disabled, ...rest } = props;
  if (!title) return <Button {...rest} />;
  return (
    <Tooltip
      content={title}
      contentProps={titleProps}
      portalled={portalled}
      showArrow={showArrow}
      disabled={disabled}
    >
      <Button {...rest} />
    </Tooltip>
  );
};
