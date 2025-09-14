import { NextResponse } from "next/server";
import { auth } from "@/auth-middleware";
import { db } from "@/db";
import { invites } from "@/db/schema";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (role !== 'admin') return new NextResponse('Forbidden', { status: 403 });
  const rows = await db.select().from(invites).orderBy(invites.createdAt);
  return NextResponse.json(rows);
}

export async function POST() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const uid = (session?.user as any)?.id as string | undefined;
  if (role !== 'admin' || !uid) return new NextResponse('Forbidden', { status: 403 });
  const code = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10)).replace(/-/g, '').slice(0, 12);
  await db.insert(invites).values({ code, createdBy: uid });
  return NextResponse.json({ code });
}

