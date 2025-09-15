import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, isMaster } from "@/lib/auth-helpers";
import { changeRoleSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;
  if (await isMaster(id)) return new NextResponse('Cannot change master admin', { status: 400 });
  const body = await req.json();
  const parsed = changeRoleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const [updated] = await db.update(profiles).set({ role: parsed.data.role as any }).where(eq(profiles.userId, id)).returning();
  return NextResponse.json(updated);
}
