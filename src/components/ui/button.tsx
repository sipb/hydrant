import type { Tooltip as ChakraTooltip } from "@chakra-ui/react";
import { Button, type ButtonProps } from "@chakra-ui/react";
import { Tooltip } from "./tooltip";
import type { RefObject } from "react";

export interface LabelledButtonProps extends ButtonProps {
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: RefObject<HTMLElement>;
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
