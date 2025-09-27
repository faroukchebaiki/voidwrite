CREATE TABLE IF NOT EXISTS "signup_requests" (
  "email" text PRIMARY KEY,
  "name" text,
  "password_hash" text NOT NULL,
  "invite_code" text,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
