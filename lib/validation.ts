import { z } from "zod";

export const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
export const PASSWORD_COMPLEXITY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const basePostSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  slug: z
    .string()
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  status: z.enum(["draft", "submitted", "published"]).default("draft"),
  coverImageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().default([]), // tag slugs
  publishedAt: z.string().datetime().optional().nullable(),
  seoKeywords: z.string().max(500).optional().nullable(),
});

export const createPostSchema = basePostSchema.superRefine((data, ctx) => {
  if (data.status !== "draft") {
    if (!data.title?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "Title is required when submitting or publishing.",
      });
    }
    if (!data.content || data.content.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Content is required when submitting or publishing.",
      });
    }
    if (!data.tags || data.tags.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["tags"],
        message: "Select at least one tag when submitting or publishing.",
      });
    }
  }
});

export const updatePostSchema = basePostSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.status && data.status !== "draft") {
      if (data.title !== undefined) {
        const value = (data.title ?? '').toString().trim();
        if (!value) {
          ctx.addIssue({
            code: "custom",
            path: ["title"],
            message: "Title is required when submitting or publishing.",
          });
        }
      }
      if (data.content !== undefined) {
        const value = (data.content ?? '').toString().trim();
        if (value.length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["content"],
            message: "Content is required when submitting or publishing.",
          });
        }
      }
      if (data.tags !== undefined && data.tags.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "Select at least one tag when submitting or publishing.",
        });
      }
    }
  });
export const updatePostWithAdminSchema = updatePostSchema;

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export const signupSchema = z.object({
  name: z.string().min(1).max(120).optional().nullable(),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(passwordComplexityRegex, PASSWORD_COMPLEXITY_MESSAGE),
  inviteCode: z.string().min(6).max(64).optional(),
});

export const signupConfirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
});

export const emailChangeStartSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
});

export const emailChangeConfirmSchema = z.object({
  oldCode: z.string().min(4).max(10),
  newCode: z.string().min(4).max(10),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(passwordComplexityRegex, PASSWORD_COMPLEXITY_MESSAGE),
});

export const passwordResetStartSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(passwordComplexityRegex, PASSWORD_COMPLEXITY_MESSAGE),
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
  avatarUrl: z.string().url().optional().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SignupConfirmInput = z.infer<typeof signupConfirmSchema>;
export type EmailChangeStartInput = z.infer<typeof emailChangeStartSchema>;
export type EmailChangeConfirmInput = z.infer<typeof emailChangeConfirmSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type PasswordResetStartInput = z.infer<typeof passwordResetStartSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type PostNoteInput = z.infer<typeof postNoteSchema>;
