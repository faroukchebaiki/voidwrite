CREATE TYPE "public"."notification_type" AS ENUM('assignment', 'submission', 'approval');--> statement-breakpoint
ALTER TYPE "public"."post_status" ADD VALUE 'submitted' BEFORE 'published';--> statement-breakpoint
CREATE TABLE "daily_post_views" (
	"post_id" integer NOT NULL,
	"day" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_post_views_pk" PRIMARY KEY("post_id","day")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"payload" json,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_master" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_unique" ON "profiles" USING btree ("username");