import "reflect-metadata";
import { __prod__, COOKIE_NAME } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from 'cors';
import { createConnection } from 'typeorm';
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from 'path';

const main = async () => {

	const connection = await createConnection({
		type: 'postgres',
		database: "creddit_dev",
		username: 'postgres',
		password: 'postgres',
		logging: true,
		synchronize: true,
		entities: [Post, User],
		migrations: [path.join(__dirname, './migrations/*')],
	});
	
	await connection.runMigrations();

	// await Post.delete({})
	// Creates middleware
	const app = express();

	// Configures redis for handling user sessions
	const RedisStore = connectRedis(session);
	const redis = new Redis();

	app.use(cors({
		origin: 'http://localhost:3000',
		credentials: true
	}))
	
	// TODO: Change secret and add to env
	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({
				client: redis,
				disableTouch: true,
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
				httpOnly: true,
				sameSite: "lax",
				secure: __prod__,
			},
			saveUninitialized: false,
			secret: "aalsi7dfhasild7hfasisjsjdhfs",
			resave: false,
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }) => ({ req, res, redis }),
	});

	apolloServer.applyMiddleware({ app, cors: false });

	app.listen(4000, () => {
		console.log("server started on localhost:4000");
	});
};

main().catch((err) => {
	console.error(err);
});
