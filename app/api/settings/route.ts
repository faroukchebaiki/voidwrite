import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { settingsSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const [row] = await db.select().from(settings).limit(1);
  return NextResponse.json(row ?? null);
}

export async function PUT(req: Request) {
  const user = await requireAdmin();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const existing = await db.select().from(settings).limit(1);
  const now = new Date();
  if (existing.length === 0) {
    const [created] = await db
      .insert(settings)
      .values({ ...parsed.data, createdAt: now, updatedAt: now })
      .returning();
    return NextResponse.json(created);
  } else {
    const [updated] = await db
      .update(settings)
      .set({ ...parsed.data, updatedAt: now })
      .where(eq(settings.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }
}
