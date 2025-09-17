ALTER TYPE "public"."notification_type" ADD VALUE 'note';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'edit';--> statement-breakpoint
CREATE TABLE "post_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
