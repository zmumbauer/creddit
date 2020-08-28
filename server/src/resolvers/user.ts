import {
	Resolver,
	Mutation,
	Arg,
	InputType,
	Field,
	Ctx,
	ObjectType,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";

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

	// Creates a new user with provided username and password through options object
	// Returns the created user
	@Mutation(() => UserResponse)
	async register(
		@Arg("options") options: UsernamePasswordInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {

		// Check that username has at least 4 characters
		if (options.username.length < 4) {
			return {
				errors: [
					{
						field: "Username",
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
						field: "Password",
						message: "Password must have at least 8 characters"
					},
				]
			}
		}

		const hashedPassword = await argon2.hash(options.password);
		const user = em.create(User, {
			username: options.username,
			password: hashedPassword,
		});
		try {
			await em.persistAndFlush(user);	
		} catch(err) {

			// Duplicate username
			if (err.code === "23505" || err.detail.include("already exists")) {
				return {
					errors: [
						{
							field: "Username",
							message: "Username has already been claimed"
						},
					]
				}
			}
		}
		
		return { user };
	}

	// Handles user login based on provided username and password
	@Mutation(() => UserResponse)
	async login(
		@Arg("options") options: UsernamePasswordInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {

		// Checks for username in database
		const user = await em.findOne(User, { username: options.username });

		// If a user with the provided username doesn't exist, returns a FieldError
		if (!user) {
			return {
				errors: [
					{
						field: "Username",
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
						field: 'Password',
						message: 'Incorrect password',
					},
				]
			}
		}

		// Upon successful login, returns the User object
		return {
			user,
		};
	}
}
