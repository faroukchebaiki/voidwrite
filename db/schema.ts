import { pgTable, text, timestamp, integer, serial, pgEnum, boolean, primaryKey, uniqueIndex, json } from "drizzle-orm/pg-core";

// Roles for CMS
export const userRole = pgEnum("user_role", ["admin", "editor"]);

// Metadata for users managed by Auth.js via PG Adapter lives in its own tables.
// We keep CMS-specific profile fields in a separate table keyed by the Auth.js user id (text).
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  role: userRole("role").notNull().default("editor"),
  // Optional hash to support credentials login in addition to social/passkeys
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  link: text("link"),
  username: text("username"),
  suspended: boolean("suspended").notNull().default(false),
  isMaster: boolean("is_master").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
}, (table) => ({
  usernameIdx: uniqueIndex("profiles_username_unique").on(table.username),
}));

export const postStatus = pgEnum("post_status", ["draft", "submitted", "published"]);

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
  views: integer("views").notNull().default(0),
  createdBy: text("created_by").notNull(),
  assignedTo: text("assigned_to"),
  submittedAt: timestamp("submitted_at", { withTimezone: false }),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: false }),
  adminNote: text("admin_note"),
  seoKeywords: text("seo_keywords"),
  publishedAt: timestamp("published_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  trashed: boolean("trashed").notNull().default(false),
  trashedAt: timestamp("trashed_at", { withTimezone: false }),
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
  siteTitle: text("site_title").notNull().default("Voidwrite"),
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

export const passkeyLabels = pgTable("passkey_labels", {
  credentialId: text("credential_id").primaryKey(),
  userId: text("user_id").notNull(),
  label: text("label").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// Invitation codes for staff onboarding
export const invites = pgTable("invites", {
  code: text("code").primaryKey(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  usedBy: text("used_by"),
  usedAt: timestamp("used_at", { withTimezone: false }),
  expiresAt: timestamp("expires_at", { withTimezone: false }),
});

// Daily post views aggregation
export const dailyPostViews = pgTable("daily_post_views", {
  postId: integer("post_id").notNull(),
  day: text("day").notNull(), // YYYY-MM-DD
  count: integer("count").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ name: "daily_post_views_pk", columns: [t.postId, t.day] }),
}));

// Notifications
export const notificationType = pgEnum("notification_type", ["assignment", "submission", "approval", "note", "edit"]);
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: notificationType("type").notNull(),
  payload: json("payload"),
  readAt: timestamp("read_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const postNotes = pgTable("post_notes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: text("author_id").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});
