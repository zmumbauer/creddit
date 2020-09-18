import { withUrqlClient } from "next-urql";
import NavBar from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { Layout } from "../components/Layout";
import NextLink from "next/link";
import { Link, Stack, Box, Heading, Text, Flex, Button } from "@chakra-ui/core";
import { useState } from "react";

const Index = () => {
  const [variables, setVariables] = useState({ limit: 10, cursor: null as null | string });

  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return <div>Query failed.</div>;
  }

  return (
    <Layout variant="small">
      <Flex align="center">
        <Heading>Creddit</Heading>
        <NextLink href="/create-post">
          <Button variantColor="blue" ml="auto">
            <Link>create post</Link>
          </Button>
        </NextLink>
      </Flex>
      <br />
      {fetching && !data ? (
        <div>"Loading..."</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((post) => (
            <Box key={post.id} p={10} shadow="md">
              <Heading fontSize="xl">{post.title}</Heading>
              <Text mt={4}>{post.text}</Text>
            </Box>
          ))}
        </Stack>
      )}
      {(data && data.posts.hasMore) ? (
        <Flex>
          <Button onClick={() => {
            setVariables({
              limit: variables.limit,
              cursor: data.posts.posts[data.posts.posts.length - 1].createdAt
            })
          }} isLoading={fetching} m="auto" my={8}>
            Load more posts
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(Index);
