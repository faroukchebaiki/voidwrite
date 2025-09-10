import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
  coverImageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().default([]), // tag slugs
  publishedAt: z.string().datetime().optional().nullable(),
});

export const updatePostSchema = createPostSchema.partial();

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export const settingsSchema = z.object({
  siteTitle: z.string().min(1).max(120),
  siteDescription: z.string().max(500).optional().nullable(),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});

export const signupSchema = z.object({
  name: z.string().min(1).max(120).optional().nullable(),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  // allow choosing admin or author (editor)
  role: z.enum(["admin", "editor"]).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
