import { NextResponse } from "next/server";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null) as { password?: string } | null;
  const password = body?.password ? String(body.password) : "";
  if (!password) {
    return NextResponse.json({ success: false, error: "Password is required." }, { status: 400 });
  }

  const uid = (session.user as any).id as string;
  const [record] = await db
    .select({ passwordHash: profiles.passwordHash })
    .from(profiles)
    .where(eq(profiles.userId, uid))
    .limit(1);

  if (!record?.passwordHash) {
    return NextResponse.json({ success: false, error: "Password login is not configured for this account." }, { status: 400 });
  }

  const valid = await verifyPassword(record.passwordHash, password);
  if (!valid) {
    return NextResponse.json({ success: false, error: "Incorrect password." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}

