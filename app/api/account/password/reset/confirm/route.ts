import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { profiles, passwordResetRequests } from "@/db/schema";
import { passwordResetConfirmSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { hashPassword } from "@/lib/password";

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = passwordResetConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, code, newPassword } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const requestRows = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.email, lowerEmail)).limit(1);
  const request = requestRows[0];
  if (!request) {
    return NextResponse.json({ error: "Reset request not found or expired." }, { status: 400 });
  }

  if (request.expiresAt < new Date()) {
    await db.delete(passwordResetRequests).where(eq(passwordResetRequests.email, lowerEmail));
    return NextResponse.json({ error: "Verification code expired." }, { status: 400 });
  }

  const matches = hashCode(code) === request.codeHash;
  if (!matches) {
    const attempts = request.attempts + 1;
    const shouldReset = attempts >= 5;
    if (shouldReset) {
      await db.delete(passwordResetRequests).where(eq(passwordResetRequests.email, lowerEmail));
      return NextResponse.json({ error: "Too many incorrect attempts. Please restart." }, { status: 400 });
    }
    await db.update(passwordResetRequests).set({ attempts }).where(eq(passwordResetRequests.email, lowerEmail));
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }

  const userRows = await db.select().from(users).where(eq(users.email, lowerEmail)).limit(1);
  const user = userRows[0];
  if (!user) {
    await db.delete(passwordResetRequests).where(eq(passwordResetRequests.email, lowerEmail));
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const hash = await hashPassword(newPassword);
  await db
    .insert(profiles)
    .values({ userId: user.id, passwordHash: hash, role: 'editor' as any })
    .onConflictDoUpdate({ target: profiles.userId, set: { passwordHash: hash } });

  await db.delete(passwordResetRequests).where(eq(passwordResetRequests.email, lowerEmail));

  return NextResponse.json({ ok: true }, { status: 200 });
}
