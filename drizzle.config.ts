import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Load env from .env.local first (Next.js style), then fallback to .env
loadEnv({ path: ".env.local" });
loadEnv();

export default {
  schema: ["./db/schema.ts", "./db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  breakpoints: true,
} satisfies Config;
