import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { profiles, invites } from "@/db/schema";
import { signupSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { email, password, name, inviteCode } = parsed.data as { email: string; password: string; name?: string | null; inviteCode?: string };

  const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  // All signups require a valid, unused invitation code; still detect first user to elevate role.
  if (!inviteCode) return NextResponse.json({ error: "Invitation code required" }, { status: 400 });
  const [inv] = await db.select().from(invites).where(eq(invites.code, inviteCode));
  if (!inv) return NextResponse.json({ error: "Invalid invitation code" }, { status: 400 });
  if (inv.usedBy) return NextResponse.json({ error: "Invitation code already used" }, { status: 400 });

  const [createdUser] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), name: name || null })
    .returning();

  const hash = await hashPassword(password);

  const existingProfiles = await db.select().from(profiles).limit(1);
  const isFirstAfter = existingProfiles.length === 0;

  // default to admin for first user (master), otherwise author/editor; ignore invite role override for first
  const finalRole = isFirstAfter ? ("admin" as const) : ("editor" as const);
  await db
    .insert(profiles)
    .values({ userId: createdUser.id, role: finalRole as any, passwordHash: hash, isMaster: isFirstAfter });

  await db
    .update(invites)
    .set({ usedBy: createdUser.id, usedAt: new Date() as any })
    .where(eq(invites.code, inviteCode));

  return NextResponse.json({ id: createdUser.id, email: createdUser.email }, { status: 201 });
}
