import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
  Int,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@Resolver()
export class PostResolver {
  // Returns all posts in database
  @Query(() => [Post])
  posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<Post[]> {
    const calcLimit = Math.min(limit, 50);
    const query = getConnection()
      .getRepository(Post)
      .createQueryBuilder("post")
      // .where("")
      .orderBy('"createdAt"', "DESC")
      .take(calcLimit);
    if (cursor) {
      query.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    return query.getMany();
  }

  // Returns a single post based on ID param
  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  // Creates a new post with given title
  // Returns the newly created post
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({ ...input, authorId: req.session.userId }).save();
  }

  // Updates existing post based on id
  // Returns the updated post if updated or null upon failure to update
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await Post.update({ id }, { title });
    }
    return post;
  }

  // Deletes the post selected by id
  // Returns boolean representing success or failure
  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    try {
      await Post.delete(id);
    } catch {
      return false;
    }

    return true;
  }
}
