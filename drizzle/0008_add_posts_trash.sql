ALTER TABLE "posts" ADD COLUMN "trashed" boolean DEFAULT false NOT NULL;
ALTER TABLE "posts" ADD COLUMN "trashed_at" timestamp;
