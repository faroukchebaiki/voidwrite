import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { updatePostSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const [row] = await db.select().from(posts).where(eq(posts.id, id));
  if (!row) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id: idParam } = await params;
  const id = Number(idParam);
  const body = await req.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const update: any = { updatedAt: new Date() };
  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.excerpt !== undefined) update.excerpt = data.excerpt;
  if (data.content !== undefined) update.content = data.content;
  if (data.status !== undefined) update.status = data.status;
  if (data.coverImageUrl !== undefined) update.coverImageUrl = data.coverImageUrl;
  if (data.publishedAt !== undefined) update.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;

  const [updated] = await db.update(posts).set(update).where(eq(posts.id, id)).returning();
  if (!updated) return new NextResponse("Not found", { status: 404 });

  if (Array.isArray(data.tags)) {
    // Reset tags
    await db.delete(postTags).where(eq(postTags.postId, id));
    const existingTags = await db.select().from(tags);
    const bySlug = new Map(existingTags.map((t) => [t.slug, t]));
    const pairs = data.tags
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((t) => ({ postId: id, tagId: (t as any).id }));
    if (pairs.length) await db.insert(postTags).values(pairs);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id: idParam } = await params;
  const id = Number(idParam);
  await db.delete(postTags).where(eq(postTags.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
  return new NextResponse(null, { status: 204 });
}
