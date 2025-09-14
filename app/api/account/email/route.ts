import { NextResponse } from "next/server";
import { auth } from "@/auth-middleware";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const form = await req.formData();
  const email = String(form.get("email") || "").toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return new NextResponse("Invalid email", { status: 400 });
  const uid = (session.user as any).id as string;
  await db.update(users).set({ email }).where(eq(users.id, uid));
  return NextResponse.redirect(new URL("/studio/settings", req.url));
}

