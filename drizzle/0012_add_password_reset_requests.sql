CREATE TABLE IF NOT EXISTS "password_reset_requests" (
  "email" text PRIMARY KEY,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
