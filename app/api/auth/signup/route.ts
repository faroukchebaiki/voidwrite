import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { profiles, invites, signupRequests } from "@/db/schema";
import { signupConfirmSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupConfirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { email, code } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const requestRows = await db.select().from(signupRequests).where(eq(signupRequests.email, lowerEmail));
  const request = requestRows[0];
  if (!request) {
    return NextResponse.json({ error: "Verification expired. Please restart signup." }, { status: 400 });
  }

  if (request.expiresAt < new Date()) {
    await db.delete(signupRequests).where(eq(signupRequests.email, lowerEmail));
    return NextResponse.json({ error: "Verification code expired." }, { status: 400 });
  }

  if (hashCode(code) !== request.codeHash) {
    await db
      .update(signupRequests)
      .set({ attempts: request.attempts + 1 })
      .where(eq(signupRequests.email, lowerEmail));
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }

  const existingUser = await db.select().from(users).where(eq(users.email, lowerEmail)).limit(1);
  if (existingUser.length > 0) {
    await db.delete(signupRequests).where(eq(signupRequests.email, lowerEmail));
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  const inviteCode = request.inviteCode || undefined;
  const existingProfiles = await db.select({ id: profiles.userId }).from(profiles).limit(1);
  const isFirstUser = existingProfiles.length === 0;

  if (!isFirstUser && !inviteCode) {
    await db.delete(signupRequests).where(eq(signupRequests.email, lowerEmail));
    return NextResponse.json({ error: "Invitation code required." }, { status: 400 });
  }

  let inviteRecord: { code: string; usedBy: string | null } | null = null;
  if (!isFirstUser && inviteCode) {
    const inviteRows = await db.select().from(invites).where(eq(invites.code, inviteCode));
    const invite = inviteRows[0];
    if (!invite) {
      await db.delete(signupRequests).where(eq(signupRequests.email, lowerEmail));
      return NextResponse.json({ error: "Invalid invitation code." }, { status: 400 });
    }
    if (invite.usedBy) {
      await db.delete(signupRequests).where(eq(signupRequests.email, lowerEmail));
      return NextResponse.json({ error: "Invitation code already used." }, { status: 400 });
    }
    inviteRecord = invite;
  }

  const [createdUser] = await db
    .insert(users)
    .values({ email: lowerEmail, name: request.name || null })
    .returning();

  const finalProfiles = await db.select({ id: profiles.userId }).from(profiles).limit(1);
  const isFirstAfter = finalProfiles.length === 0;
  const finalRole = isFirstAfter ? ("admin" as const) : ("editor" as const);

  await db
    .insert(profiles)
    .values({ userId: createdUser.id, role: finalRole as any, passwordHash: request.passwordHash, isMaster: isFirstAfter });

  if (!isFirstAfter && inviteRecord) {
    await db
      .update(invites)
      .set({ usedBy: createdUser.id, usedAt: new Date() as any })
      .where(eq(invites.code, inviteRecord.code));
  }

  await db.delete(signupRequests).where(eq(signupRequests.email, lowerEmail));

  return NextResponse.json({ id: createdUser.id, email: createdUser.email }, { status: 201 });
}
