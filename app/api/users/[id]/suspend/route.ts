import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, isMaster } from "@/lib/auth-helpers";

export async function POST(req: Request, context: any) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = (context?.params || {}) as { id: string };
  if (await isMaster(id)) return new NextResponse('Cannot suspend master admin', { status: 400 });
  const { suspended } = await req.json().catch(() => ({ suspended: true }));
  const [updated] = await db.update(profiles).set({ suspended: !!suspended }).where(eq(profiles.userId, id)).returning();
  return NextResponse.json(updated);
}
