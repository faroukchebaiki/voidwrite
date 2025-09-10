import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { tagSchema } from "@/lib/validation";

export async function GET() {
  const rows = await db.select().from(tags).orderBy(desc(tags.name));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const [created] = await db.insert(tags).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: Request) {
  const user = await requireAdmin();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const parsed = tagSchema.extend({ id: (val: any) => Number(val) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { id, ...data } = parsed.data as any;
  const [updated] = await db.update(tags).set(data).where(eq(tags.id, id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const user = await requireAdmin();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return new NextResponse("Missing id", { status: 400 });
  await db.delete(tags).where(eq(tags.id, id));
  return new NextResponse(null, { status: 204 });
}

