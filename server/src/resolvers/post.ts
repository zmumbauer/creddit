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
  ObjectType,, FieldResolver
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

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver()
export class PostResolver {

  // Returns all posts in database
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    // Takes either user defined limit or 50 by default
    const calcLimit = Math.min(limit, 50);
    const calcLimitPlusOne = calcLimit + 1;

    const replacements: any[] = [calcLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    

    const posts = await getConnection().query(
      `
      select p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u."createdAt",
        'updatedAt', u."updatedAt"
        ) author
      from post p
      inner join public.user u on u.id = p."authorId"
      ${cursor ? 'where p."createdAt" < $2' : ""}
      order by p."createdAt" DESC
      limit $1
    `,
      replacements
    );

      console.log(posts);

    // const query = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("post")
    //   .orderBy('post."createdAt"', "DESC")
    //   .take(calcLimitPlusOne);

    // if (cursor) {
    //   query.where('post."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await query.getMany();

    return {
      posts: posts.slice(0, calcLimit),
      hasMore: posts.length === calcLimitPlusOne,
    };
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
