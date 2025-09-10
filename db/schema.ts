import { pgTable, text, timestamp, integer, serial, pgEnum, boolean, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

// Roles for CMS
export const userRole = pgEnum("user_role", ["admin", "editor", "user"]);

// Metadata for users managed by Auth.js via PG Adapter lives in its own tables.
// We keep CMS-specific profile fields in a separate table keyed by the Auth.js user id (text).
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  role: userRole("role").notNull().default("editor"),
  // Optional hash to support credentials login in addition to social/passkeys
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const postStatus = pgEnum("post_status", ["draft", "published"]);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  excerpt: text("excerpt"),
  // Markdown source content
  content: text("content").notNull(),
  status: postStatus("status").notNull().default("draft"),
  authorId: text("author_id").notNull(), // references Auth.js users.id
  coverImageUrl: text("cover_image_url"),
  publishedAt: timestamp("published_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex("posts_slug_unique").on(table.slug),
}));

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
}, (table) => ({
  tagSlugIdx: uniqueIndex("tags_slug_unique").on(table.slug),
  tagNameIdx: uniqueIndex("tags_name_unique").on(table.name),
}));

export const postTags = pgTable("post_tags", {
  postId: integer("post_id").notNull(),
  tagId: integer("tag_id").notNull(),
}, (t) => ({
  pk: primaryKey({ name: "post_tags_pk", columns: [t.postId, t.tagId] }),
}));

// Site settings (single row)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  siteTitle: text("site_title").notNull().default("My Blog"),
  siteDescription: text("site_description"),
  theme: text("theme").default("system"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// Optional: local WebAuthn credentials registry (Auth.js PG adapter also creates authenticators internally)
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  credentialId: text("credential_id").notNull(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  transports: text("transports"), // comma-separated list
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
}, (table) => ({
  credIdUnique: uniqueIndex("webauthn_credential_id_unique").on(table.credentialId),
}));
