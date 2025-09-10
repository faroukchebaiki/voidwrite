import { NextResponse } from "next/server";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const form = await req.formData();
  const password = String(form.get("password") || "");
  if (password.length < 8) return new NextResponse("Password too short", { status: 400 });
  const hash = await hashPassword(password);
  const uid = (session.user as any).id as string;
  await db
    .insert(profiles)
    .values({ userId: uid, passwordHash: hash, role: 'editor' as any })
    .onConflictDoUpdate({ target: profiles.userId, set: { passwordHash: hash } });
  return NextResponse.redirect(new URL("/account", req.url));
}
