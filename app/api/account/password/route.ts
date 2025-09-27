import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { passwordChangeSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { currentPassword, newPassword } = parsed.data;
  const uid = (user as any)?.id as string | undefined;
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const profileRows = await db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);
  const profile = profileRows[0];
  if (!profile?.passwordHash) {
    return NextResponse.json({ error: "No password is set for this account." }, { status: 400 });
  }
  const ok = await verifyPassword(profile.passwordHash, currentPassword);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const hash = await hashPassword(newPassword);
  if (profile) {
    await db.update(profiles).set({ passwordHash: hash }).where(eq(profiles.userId, uid));
  } else {
    await db.insert(profiles).values({ userId: uid, passwordHash: hash, role: 'editor' as any });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
