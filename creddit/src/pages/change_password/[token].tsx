import React from 'react';
import { NextPage } from 'next';
import Wrapper from '../../components/Wrapper';
import { Formik, Form } from 'formik';
import login from '../login';
import { toErrorMap } from '../../utils/toErrorMap';
import InputField from '../../components/InputField';
import { Box, Button } from '@chakra-ui/core';

const ChangePassword: NextPage<{token: string}> = ({token}) => {
    return(
        <Wrapper size="small">
        <Formik
          initialValues={{ newPassword: "" }}
          onSubmit={async (values, { setErrors }) => {
            // Send form data to graphql endpoint
            // const res = await login(values);
  
            // Check if graphql returns form field errors
            // If there is an error, display in form field
            // if (res.data?.login.errors) {
            //   setErrors(toErrorMap(res.data.login.errors));
            // }
            // If graphql returns user, switch to root path
            // else if (res.data?.login.user) {
            //   router.push("/");
            // }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
                <InputField
                  name="newPassword"
                  placeholder="newPassword"
                  label="New Password"
                  type="password"
                />
  
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
}

ChangePassword.getInitialProps = ({query}) => {
    return {
        token: query.token as string,
    }
}

export default ChangePassword