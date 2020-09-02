import React from "react";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NavBar from "./NavBar";
import Wrapper, { WrapperVariant } from "./Wrapper";

interface LayoutProps {
  variant: WrapperVariant;
}

export const Layout: React.FC<LayoutProps> = ({ children, variant }) => {
  return (
    <>
      <NavBar />
      <Wrapper>{children}</Wrapper>
    </>
  );
};
