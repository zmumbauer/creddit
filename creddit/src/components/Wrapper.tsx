import React from "react";
import { Box } from "@chakra-ui/core";

export type WrapperVariant = "small" | "regular";


interface WrapperProps {
  size?: WrapperVariant;
}

const Wrapper: React.FC<WrapperProps> = ({ children, size = "regular" }) => {
  return (
    <Box
      mt={8}
      mx="auto"
      maxW={size === "regular" ? "800px" : "400px"}
      w="100%"
    >
      {children}
    </Box>
  );
};

export default Wrapper;
