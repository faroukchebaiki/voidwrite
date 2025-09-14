CREATE TABLE "invites" (
	"code" text PRIMARY KEY NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_by" text,
	"used_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'editor';