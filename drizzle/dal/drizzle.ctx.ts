import { env } from "@env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const db = drizzle({ client: postgres(env.POSTGRES_RUNNER_URL) });

export type Database = typeof db;
