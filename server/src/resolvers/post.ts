import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";

@Resolver()
export class PostResolver {

	// Returns all posts in database
	@Query(() => [Post])
	posts(@Ctx() { em }: MyContext): Promise<Post[]> {
		return em.find(Post, {});
	}

	// Returns a single post based on ID param
	@Query(() => Post, { nullable: true })
	post(
		@Arg("id", () => Int) id: number,
		@Ctx() { em }: MyContext
	): Promise<Post | null> {
		return em.findOne(Post, { id });
	}

	// Creates a new post with given title
	// Returns the newly created post
	@Mutation(() => Post)
	async createPost(
		@Arg("title", () => String) title: string,
		@Ctx() { em }: MyContext
	): Promise<Post> {
		const post = em.create(Post, { title });
		await em.persistAndFlush(post);
		return post;
	}

	// Updates existing post based on id
	// Returns the updated post if updated or null upon failure to update
	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg("id") id: number,
		@Arg("title", () => String, { nullable: true }) title: string,
		@Ctx() { em }: MyContext
	): Promise<Post | null> {
		const post = await em.findOne(Post, { id });
		if (!post) {
			return null;
		}
		if (typeof title !== 'undefined') {
			post.title = title;
			await em.persistAndFlush(post);
		}
		return post;
	}

	// Deletes the post selected by id
	// Returns boolean representing success or failure
	@Mutation(() => Boolean)
	async deletePost(
		@Arg("id") id: number,
		@Ctx() { em }: MyContext
	): Promise<boolean> {
		try {
			await em.nativeDelete(Post, { id });
		} catch {
			return false;
		}
		
		return true;
	}
}