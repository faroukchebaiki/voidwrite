import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";

import { requireStaff } from "@/lib/auth-helpers";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function GET() {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (user as any).id as string;

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, uid), isNull(notifications.readAt)))
    .limit(1);

  const unread = row?.count ?? 0;
  return NextResponse.json({ unread: Number(unread) });
}
