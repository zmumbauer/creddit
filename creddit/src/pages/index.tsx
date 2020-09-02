import { withUrqlClient } from "next-urql";
import NavBar from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { Layout } from "../components/Layout";
import NextLink from "next/link";
import { Link, Stack, Box, Heading, Text, Flex, Button } from "@chakra-ui/core";

const Index = () => {
  const [{ data, fetching }] = usePostsQuery({
    variables: {
      limit: 10,
    },
  });
  return (
    <Layout variant="small">
      <Flex align="center">
        <Heading>Creddit</Heading>
      <NextLink href="/create-post">
        <Button variantColor="blue" ml="auto"><Link>create post</Link></Button>
      </NextLink>
      </Flex>
      <br/>
      {fetching && !data ? <div>"Loading..."</div> : (
        <Stack spacing={8}>
          {data.posts.map((post) => (
            <Box key={post.id} p={10} shadow="md">
              <Heading fontSize='xl'>{post.title}</Heading>
              <Text mt={4}>{post.text}</Text>
            </Box>
          ))}
        </Stack>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(Index);
