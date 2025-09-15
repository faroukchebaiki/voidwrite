import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { serverEnv } from "../lib/env";

const env = serverEnv();
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

export const db = drizzle(pool);
export { pool };
