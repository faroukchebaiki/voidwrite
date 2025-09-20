import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  status: z.enum(["draft", "submitted", "published"]).default("draft"),
  coverImageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().default([]), // tag slugs
  publishedAt: z.string().datetime().optional().nullable(),
  seoKeywords: z.string().max(500).optional().nullable(),
});

export const updatePostSchema = createPostSchema.partial();
export const updatePostWithAdminSchema = updatePostSchema;

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export const signupSchema = z.object({
  name: z.string().min(1).max(120).optional().nullable(),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  inviteCode: z.string().min(6).max(64).optional(),
});

export const assignPostSchema = z.object({
  assignedTo: z.string().uuid(),
  note: z.string().max(2000).optional().nullable(),
});
export const postNoteSchema = z.object({ note: z.string().min(1).max(2000) });
export const changeRoleSchema = z.object({ role: z.enum(["admin","editor"]) });
export const profileSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  link: z.string().url().optional().nullable(),
  username: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/).optional().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PostNoteInput = z.infer<typeof postNoteSchema>;
