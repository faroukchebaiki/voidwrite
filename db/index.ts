import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/db";
const pool = new Pool({ connectionString, max: 10 });

export const db = drizzle(pool);
export { pool };
