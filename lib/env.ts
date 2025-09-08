import { z } from 'zod';

const serverSchema = z.object({
  // Public identifiers also available on server
  SANITY_API_PROJECT_ID: z.string().min(1),
  SANITY_API_DATASET: z.string().min(1),

  // Studio (may mirror the API values)
  SANITY_STUDIO_PROJECT_ID: z.string().min(1).optional(),
  SANITY_STUDIO_DATASET: z.string().min(1).optional(),

  // Public variants strictly used on the client
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),

  // Tokens for server-side operations only
  SANITY_API_READ_TOKEN: z.string().optional(),
  SANITY_API_WRITE_TOKEN: z.string().optional(),

  // Optional basic auth for /studio
  STUDIO_BASIC_AUTH_USER: z.string().optional(),
  STUDIO_BASIC_AUTH_PASS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedEnv: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    // Create clear error messages for missing vars
    const formatted = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Missing or invalid env variables.\n${formatted}\n\n` +
        'See README for required variables and setup.'
    );
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

const publicSchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
});

const parsedPublic = publicSchema.safeParse(process.env);
if (!parsedPublic.success) {
  const formatted = parsedPublic.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Missing or invalid public env variables.\n${formatted}\n\n` +
      'Please set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.'
  );
}

export const publicEnv = {
  projectId: parsedPublic.data.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: parsedPublic.data.NEXT_PUBLIC_SANITY_DATASET,
} as const;
