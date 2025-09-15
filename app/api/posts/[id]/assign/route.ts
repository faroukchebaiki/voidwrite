import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { assignPostSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const { id: idParam } = await params;
  const id = Number(idParam);
  const body = await req.json();
  const parsed = assignPostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { assignedTo } = parsed.data;
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return new NextResponse("Not found", { status: 404 });
  const [updated] = await db.update(posts).set({ assignedTo, updatedAt: new Date() }).where(eq(posts.id, id)).returning();
  // Notify assignee
  await db.insert(notifications).values({ userId: assignedTo, type: 'assignment' as any, payload: { postId: id, title: p.title } as any });
  return NextResponse.json(updated);
}
