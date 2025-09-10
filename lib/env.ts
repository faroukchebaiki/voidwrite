import { z } from 'zod';

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),

  AUTH_WEBAUTHN_RP_NAME: z.string().min(1),
  AUTH_WEBAUTHN_RP_ID: z.string().min(1),
  AUTH_WEBAUTHN_ORIGIN: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedEnv: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
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

// No public env required yet; add as needed
export const publicEnv = {} as const;
