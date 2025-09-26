-- Remove obsolete 'user' role and constrain to admin/editor
UPDATE "profiles" SET "role" = 'editor' WHERE "role" = 'user';
ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'editor';
ALTER TYPE "public"."user_role" RENAME TO "user_role_old";
CREATE TYPE "public"."user_role" AS ENUM ('admin', 'editor');
ALTER TABLE "profiles" ALTER COLUMN "role" TYPE "public"."user_role" USING "role"::text::"public"."user_role";
ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'editor';
DROP TYPE "public"."user_role_old";
