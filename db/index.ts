import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, max: 10 }) : null;

const database = (() => {
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Database access is disabled.");
    const message = "Database connection is not configured. Set DATABASE_URL to enable database features.";
    return new Proxy(
      {},
      {
        get() {
          throw new Error(message);
        },
      }
    ) as ReturnType<typeof drizzle>;
  }
  return drizzle(pool!);
})();

export const db = database;
export { pool };
