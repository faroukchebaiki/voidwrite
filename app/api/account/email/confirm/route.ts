import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { emailChangeConfirmSchema } from "@/lib/validation";
import { emailChangeRequests } from "@/db/schema";
import { requireStaff } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = emailChangeConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { oldCode, newCode } = parsed.data;
  const uid = (user as any)?.id as string | undefined;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestRows = await db.select().from(emailChangeRequests).where(eq(emailChangeRequests.userId, uid)).limit(1);
  const request = requestRows[0];
  if (!request) {
    return NextResponse.json({ error: "No pending email change." }, { status: 400 });
  }

  if (request.expiresAt < new Date()) {
    await db.delete(emailChangeRequests).where(eq(emailChangeRequests.userId, uid));
    return NextResponse.json({ error: "Verification codes expired." }, { status: 400 });
  }

  const oldMatches = hashCode(oldCode) === request.oldCodeHash;
  const newMatches = hashCode(newCode) === request.newCodeHash;

  if (!oldMatches || !newMatches) {
    const attempts = request.attempts + 1;
    const shouldReset = attempts >= 5;
    if (shouldReset) {
      await db.delete(emailChangeRequests).where(eq(emailChangeRequests.userId, uid));
      return NextResponse.json({ error: "Too many incorrect attempts. Please restart." }, { status: 400 });
    }
    await db
      .update(emailChangeRequests)
      .set({ attempts })
      .where(eq(emailChangeRequests.userId, uid));
    return NextResponse.json({ error: "Invalid verification codes." }, { status: 400 });
  }

  await db.update(users).set({ email: request.newEmail }).where(eq(users.id, uid));
  await db.delete(emailChangeRequests).where(eq(emailChangeRequests.userId, uid));

  return NextResponse.json({ ok: true, email: request.newEmail }, { status: 200 });
}
