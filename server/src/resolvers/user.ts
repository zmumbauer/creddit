import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { getConnection } from "typeorm";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { sendEmail } from "../utils/sendEmail";
import { validateUserRegistration } from "../utils/validateUserRegistration";
import { UsernamePasswordInput } from "./UsernamePasswordInput";

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

@Resolver(User)
export class UserResolver {

  @FieldResolver(() =>  String)
  email(@Root() user: User, @Ctx() {req}: MyContext) {
    // email belongs to current authenticated user, so show email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // if the current user is not associated with this record, return empty string
    return "";
  }
  
  // Changes a user's password
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis }: MyContext
  ): Promise<UserResponse> {
    // Check that new password has at least 8 characters
    if (newPassword.length < 8) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Password must have at least 8 characters",
          },
        ],
      };
    }

    // Redis key
    const key = FORGET_PASSWORD_PREFIX + token;

    // Get user id from redis using token
    const userId = await redis.get(key);

    // If cannot find user from token
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Token has expired. Request a new token.",
          },
        ],
      };
    }

    const user = await User.findOne(parseInt(userId));

    // If cannot find user by token
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User no longer exists",
          },
        ],
      };
    }

    // Hash the new password and save to user
    user.password = await argon2.hash(newPassword);

    // Push to database
    await User.update(
      { id: parseInt(userId) },
      {
        password: await argon2.hash(newPassword),
      }
    );

    // Remove token entry from redis
    await redis.del(key);

    // Return the user
    return { user };
  }

  // Sends an email to the user
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    // Get user by provided email
    const user = await User.findOne({ where: { email } });

    // If not in the database; do nothing and return true
    if (!user) {
      return true;
    }

    const token = v4();
    redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24
    );

    await sendEmail(
      email,
      `<a href="localhost:3000/change_password/${token}">reset password</a>`
    );
    return true;
  }

  // Returns a user if stored in session (logged in)
  // Returns null if no user is authenticated
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  // Creates a new user with provided username and password through options object
  // Returns the created user
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // Get result from user registration validations
    const errors = validateUserRegistration(options);
    if (errors) {
      return { errors };
    }

    // Create a hashed password using the user supplied password
    const hashedPassword = await argon2.hash(options.password);

    // Insert the user into the database
    let user;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning("*")
        .execute();
      user = result.raw[0];

      // Rename columns from knex
      user.createdAt = user.created_at;
      user.updatedAt = user.updated_at;
    } catch (err) {
      // Duplicate username
      if (err.detail.includes("already exists")) {
        return {
          errors: [
            {
              field: "username",
              message: "Username has already been claimed",
            },
          ],
        };
      }
    }

    // stores user in session
    req.session.userID = user.id;

    return { user };
  }

  // Handles user login based on provided username and password
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // Checks for username in database
    const user = await User.findOne({
      where: usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    });

    // If a user with the provided username doesn't exist, returns a FieldError
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Username not found",
          },
        ],
      };
    }

    // Validates stored password with supplied password
    const validatePassword = await argon2.verify(user.password, password);
    if (!validatePassword) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
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
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
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
      })
    );
  }
}
