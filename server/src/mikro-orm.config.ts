import { Post } from "./entities/Post";
import { __prod__ } from "./constants";
import path from "path";

export default {
	migrations: {
		path: path.join(__dirname, './migrations'),
		pattern: /^[\w-]+\d+\.[tj]s$/,
	},
	entities: [Post],
	dbName: "creddit",
	type: "postgresql",
	debug: !__prod__,
} as const;
