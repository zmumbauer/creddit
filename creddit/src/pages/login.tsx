import { Box, Button, Link } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useLoginMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { toErrorMap } from "../utils/toErrorMap";

const Login: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [{}, login] = useLoginMutation();

  return (
    <Wrapper size="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          // Send form data to graphql endpoint
          const res = await login(values);

          // Check if graphql returns form field errors
          // If there is an error, display in form field
          if (res.data?.login.errors) {
            setErrors(toErrorMap(res.data.login.errors));
          }
          // If graphql returns user, switch to root path
          else if (res.data?.login.user) {
            if (typeof router.query.next === 'string') {
              router.push(router.query.next);  
            } else {
              router.push("/");
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="username or email"
              label="Username or Email"
            />

            <Box mt={10}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>

            <Box mt={2}><NextLink href="/forgot-password"><Link>Forgot password?</Link></NextLink></Box>

            <Button
              type="submit"
              variantColor="blue"
              mt={10}
              isLoading={isSubmitting}
            >
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Login);
