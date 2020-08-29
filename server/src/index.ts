import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from 'cors';

const main = async () => {
	// Creates the database
	const orm = await MikroORM.init(microConfig);

	// Runs migrations
	await orm.getMigrator().up();

	// Creates middleware
	const app = express();

	// Configures redis for handling user sessions
	const RedisStore = connectRedis(session);
	const redisClient = redis.createClient();

	app.use(cors({
		origin: 'http://localhost:3000',
		credentials: true
	}))
	
	// TODO: Change secret and add to env
	app.use(
		session({
			name: "rid",
			store: new RedisStore({
				client: redisClient,
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
		context: ({ req, res }) => ({ em: orm.em, req, res }),
	});

	apolloServer.applyMiddleware({ app, cors: false });

	app.listen(4000, () => {
		console.log("server started on localhost:4000");
	});
};

main().catch((err) => {
	console.error(err);
});
