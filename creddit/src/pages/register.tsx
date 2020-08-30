import React from "react";
import { Formik, Form } from "formik";
import {
  Box,
  Button,
} from "@chakra-ui/core";
import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  const [{}, register] = useRegisterMutation();

  return (
    <Wrapper size="small">
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          
          // Send form data to graphql endpoint
          const res = await register(values);

          // Check if graphql returns form field errors
          // If there is an error, display in form field
          if (res.data?.register.errors) {
            setErrors(toErrorMap(res.data.register.errors));
          }
          // If graphql returns user, switch to root path
          else if (res.data?.register.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              placeholder="username"
              label="Username"
            />

            <Box mt={10}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>

            <Button
              type="submit"
              variantColor="blue"
              mt={10}
              isLoading={isSubmitting}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
