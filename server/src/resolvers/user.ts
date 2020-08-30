import {
	Resolver,
	Mutation,
	Arg,
	InputType,
	Field,
	Ctx,
	ObjectType,
	Query
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME } from "../constants";

// Creates fields for username and password for registration and login
@InputType()
class UsernamePasswordInput {
	@Field()
	username: string;
	@Field()
	password: string;
}

// Object to return an error message specific to a user-input field
@ObjectType()
class FieldError {
	@Field()
	field: string;
	@Field()
	message: string;
}

// Object that is returned on login.
// Returns a User object upon success
// Returns a FieldError object upon failure
@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {

	// Returns a user if stored in session (logged in)
	// Returns null if no user is authenticated
	@Query(() => User, { nullable: true })
	async me (
		@Ctx() { em, req }: MyContext
	) {
		if (!req.session.userId) {
			return null;
		}

		const user = await em.findOne(User, { id: req.session.userId});
		return user;
	}


	// Creates a new user with provided username and password through options object
	// Returns the created user
	@Mutation(() => UserResponse)
	async register(
		@Arg("options") options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {

		// Check that username has at least 4 characters
		if (options.username.length < 4) {
			return {
				errors: [
					{
						field: "username",
						message: "Username must have at least 4 characters"
					},
				]
			}
		}

		// Check that password has at least 8 characters
		if (options.password.length < 8) {
			return {
				errors: [
					{
						field: "password",
						message: "Password must have at least 8 characters"
					},
				]
			}
		}

		// Create a hashed password using the user supplied password
		const hashedPassword = await argon2.hash(options.password);

		// Insert the user into the database
		let user;
		try {
			const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert(
				{
					username: options.username,
					password: hashedPassword,
					created_at: new Date(),
					updated_at: new Date(),
				}
			).returning('*');
			user = result[0];

			// Rename columns from knex
			user.createdAt = user.created_at;
			user.updatedAt = user.updated_at;
		} catch(err) {
			// Duplicate username
			if (err.detail.includes("already exists")) {
				return {
					errors: [
						{
							field: "username",
							message: "Username has already been claimed"
						},
					]
				}
			}
		}
		
		// stores user in session
		req.session.userID = user.id;

		return { user };
	}

	// Handles user login based on provided username and password
	@Mutation(() => UserResponse)
	async login(
		@Arg("options") options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {

		// Checks for username in database
		const user = await em.findOne(User, { username: options.username });

		// If a user with the provided username doesn't exist, returns a FieldError
		if (!user) {
			return {
				errors: [
					{
						field: "username",
						message: "Username not found",
					},
				],
			};
		}

		// Validates stored password with supplied password
		const validatePassword = await argon2.verify(user.password, options.password);
		if (!validatePassword) {
			return {
				errors: [
					{
						field: 'password',
						message: 'Incorrect password',
					},
				]
			}
		}


		req.session.userId = user.id;

		// Upon successful login, returns the User object
		return {
			user,
		};
	}

	// Handles unauthentication of user
	// Returns true upon success; false on failure
	@Mutation(() => Boolean)
	logout(
		@Ctx() { req, res }: MyContext
	) {
		return new Promise(resolve => req.session.destroy(err => {

			// If there is an error, log to console
			// Return false
			if (err) {
				console.log(err);
				resolve(false);
				return;
			}

			// If no errors, remove the user authentication cookie from the session
			// Return true
			res.clearCookie(COOKIE_NAME);
			resolve(true);
		})) 
	}
}
