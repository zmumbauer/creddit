import { Button, Box } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import React, { useState } from 'react';
import InputField from '../../components/InputField';
import Wrapper from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { toErrorMap } from '../../utils/toErrorMap';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';

const ChangePassword: NextPage<{token: string}> = ({token}) => {
    const router = useRouter();
    const [, changePassword] = useChangePasswordMutation();
    const [tokenError, setTokenError] = useState('');

    return(
        <Wrapper size="small">
        <Formik
          initialValues={{ newPassword: "" }}
          onSubmit={async (values, { setErrors }) => {
            // Send form data to graphql endpoint
            const res = await changePassword({newPassword: values.newPassword, token});
  
            // Check if graphql returns form field errors
            // If there is an error, display in form field
            if (res.data?.changePassword.errors) {

                // If there is an error with the token
                const errorMap = toErrorMap(res.data.changePassword.errors);
                if ('token' in errorMap) {
                    setTokenError(errorMap.token);
                }
              setErrors(errorMap);
            }

            // If graphql returns user, switch to root path
            else if (res.data?.changePassword.user) {
              router.push("/");
            }
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
                {tokenError ? <Box color="red">{tokenError}</Box> : null}
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

export default withUrqlClient(createUrqlClient)(ChangePassword)