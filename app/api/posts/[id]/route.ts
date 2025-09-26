import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postTags, tags, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth-helpers";
import { updatePostSchema, updatePostWithAdminSchema } from "@/lib/validation";

export async function GET(_req: Request, context: any) {
  // Draft/internal post fields should not be public
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (user as any).id as string;
  const role = (user as any).role as string | undefined;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);
  const [row] = await db.select().from(posts).where(eq(posts.id, id));
  if (!row) return new NextResponse("Not found", { status: 404 });
  const isOwner = row.authorId === uid;
  const isAssignee = !!row.assignedTo && row.assignedTo === uid;
  if (role !== 'admin' && !isOwner && !isAssignee) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  return NextResponse.json(row);
}

export async function PATCH(req: Request, context: any) {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (user as any).id as string;
  const role = (user as any).role as string | undefined;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);
  const body = await req.json();
  const parsed = (role === 'admin' ? updatePostWithAdminSchema : updatePostSchema).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const [existing] = await db.select().from(posts).where(eq(posts.id, id));
  if (!existing) return new NextResponse("Not found", { status: 404 });

  // Permissions: authors can edit drafts they authored/assigned; cannot publish
  const isOwnerOrAssignee = existing.authorId === uid || existing.assignedTo === uid;
  if (role !== 'admin') {
    // Authors: block publish
    if (data.status === 'published') return new NextResponse('Forbidden', { status: 403 });
    // Only allow edit if owner/assignee
    if (!isOwnerOrAssignee) return new NextResponse('Forbidden', { status: 403 });
  }

  const update: any = { updatedAt: new Date() };
  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.excerpt !== undefined) update.excerpt = data.excerpt;
  if (data.content !== undefined) update.content = data.content;
  if (data.coverImageUrl !== undefined) update.coverImageUrl = data.coverImageUrl;
  if (data.seoKeywords !== undefined) {
    const keywords = data.seoKeywords;
    const trimmed = typeof keywords === "string" ? keywords.trim() : keywords;
    update.seoKeywords = trimmed ? (trimmed as any) : null;
  }
  // Only admins can set or change publishedAt
  if (role === 'admin' && data.publishedAt !== undefined) {
    update.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
  }
  if (data.status !== undefined) {
    update.status = data.status;
    if (data.status === 'submitted') update.submittedAt = new Date();
    if (role === 'admin' && data.status === 'published') {
      update.approvedBy = uid; update.approvedAt = new Date();
      if (!existing.publishedAt) update.publishedAt = new Date();
    }
  }

  let updated: typeof posts.$inferSelect | undefined;
  try {
    [updated] = await db.update(posts).set(update).where(eq(posts.id, id)).returning();
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    console.error('Failed to update post', err);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
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

  if (role === 'admin' && existing.authorId && existing.authorId !== uid) {
    await db.insert(notifications).values({
      userId: existing.authorId,
      type: 'edit' as any,
      payload: { postId: id, title: existing.title } as any,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, context: any) {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (user as any).id as string;
  const role = (user as any).role as string | undefined;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);

  const [existing] = await db.select().from(posts).where(eq(posts.id, id));
  if (!existing) return new NextResponse("Not found", { status: 404 });

  // Admins can delete any post. Editors can delete only their own unassigned drafts.
  const isAdmin = role === 'admin';
  const isOwner = existing.authorId === uid;
  const isDraft = String(existing.status) === 'draft';
  const isUnassigned = !existing.assignedTo;
  if (!isAdmin && !(isOwner && isDraft && isUnassigned)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  await db.delete(postTags).where(eq(postTags.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
  return new NextResponse(null, { status: 204 });
}
