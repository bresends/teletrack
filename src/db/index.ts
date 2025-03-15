import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { config } from "../env.ts";
import * as schema from "./schema";

export const client = new Client({
	connectionString: config.DATABASE_URL,
});

export const db = drizzle(client, {
	casing: "snake_case",
	schema,
});
