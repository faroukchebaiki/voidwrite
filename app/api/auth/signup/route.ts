import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { profiles } from "@/db/schema";
import { signupSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { email, password, name, role: requestedRole } = parsed.data as { email: string; password: string; name?: string | null; role?: 'admin' | 'editor' };

  const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const [createdUser] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), name: name || null })
    .returning();

  const hash = await hashPassword(password);

  const existingProfiles = await db.select().from(profiles).limit(1);
  const isFirst = existingProfiles.length === 0;

  // default to admin for first user, otherwise author/editor
  const finalRole = (requestedRole as any) || (isFirst ? ("admin" as const) : ("editor" as const));
  await db
    .insert(profiles)
    .values({ userId: createdUser.id, role: finalRole as any, passwordHash: hash });

  return NextResponse.json({ id: createdUser.id, email: createdUser.email }, { status: 201 });
}
