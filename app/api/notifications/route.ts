import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireStaff } from "@/lib/auth-helpers";

export async function GET() {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (user as any).id as string;
  const rows = await db.select().from(notifications).where(eq(notifications.userId, uid)).orderBy(desc(notifications.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { ids } = await req.json().catch(() => ({ ids: [] }));
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ ok: true });
  const now = new Date();
  await Promise.all(ids.map((id: number) => db.update(notifications).set({ readAt: now as any }).where(eq(notifications.id, id))));
  return NextResponse.json({ ok: true });
}
