import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (admin as any).id as string;
  const { id: idParam } = await params;
  const id = Number(idParam);
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return new NextResponse("Not found", { status: 404 });
  const [updated] = await db.update(posts).set({ status: 'published' as any, approvedBy: uid, approvedAt: new Date(), publishedAt: p.publishedAt || (new Date()), updatedAt: new Date() }).where(eq(posts.id, id)).returning();
  // Notify author if exists
  await db.insert(notifications).values({ userId: p.authorId, type: 'approval' as any, payload: { postId: id, title: p.title } as any });
  return NextResponse.json(updated);
}
