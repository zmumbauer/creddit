import React from "react";
import { Formik, Form } from "formik";
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Box,
  Button,
} from "@chakra-ui/core";
import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  return (
    <Wrapper size="small">
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            
            <InputField name="username" placeholder="username" label="Username" />

            <Box mt={10} >
            <InputField name="password" placeholder="password" label="Password" type="password" />
            </Box>
            
            <Button type="submit" variantColor="blue" mt={10} isLoading={isSubmitting}>Register</Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
