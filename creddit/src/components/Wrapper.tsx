import React from "react";
import { Box } from "@chakra-ui/core";

interface WrapperProps {
  size?: "small" | "regular";
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
