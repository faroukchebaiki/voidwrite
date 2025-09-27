CREATE TABLE IF NOT EXISTS "email_change_requests" (
  "user_id" text PRIMARY KEY,
  "new_email" text NOT NULL,
  "old_code_hash" text NOT NULL,
  "new_code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
