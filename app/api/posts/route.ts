import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { createPostSchema } from "@/lib/validation";
import { requireAdmin, requireStaff } from "@/lib/auth-helpers";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  // This endpoint returns drafts and internal fields; restrict to admins
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt ?? posts.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const role = (user as any).role as string | undefined;
  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;
  const keywords = data.seoKeywords?.trim();

  const rawTitle = (data.title ?? '').toString();
  const rawSlug = (data.slug ?? '').toString();
  const rawContent = (data.content ?? '').toString();
  const title = rawTitle;
  let slug = rawSlug.trim() || slugify(rawTitle);
  if (!slug) slug = `draft-${Date.now().toString(36)}`;
  const content = rawContent;

  const now = new Date();
  let created: typeof posts.$inferSelect | undefined;
  try {
    [created] = await db
      .insert(posts)
      .values({
        title,
        slug,
        excerpt: data.excerpt || null,
        content,
        // Only admins can create published posts; non-admins always start in draft
        status: role === 'admin' ? data.status : ('draft' as any),
        coverImageUrl: data.coverImageUrl || null,
        seoKeywords: keywords || null,
        authorId: (user as any).id,
        createdBy: (user as any).id,
        assignedTo: null,
        submittedAt: null,
        approvedBy: null,
        approvedAt: null,
        publishedAt: role === 'admin' && data.status === "published" ? (data.publishedAt ? new Date(data.publishedAt) : now) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    console.error('Failed to create post', err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }

  if (!created) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }

  if (data.tags && data.tags.length > 0) {
    const tagRows = await db.select().from(tags).where(inArray(tags.slug, data.tags));
    const pairs = tagRows.map((t) => ({ postId: created.id, tagId: t.id }));
    if (pairs.length) await db.insert(postTags).values(pairs).onConflictDoNothing();
  }

  return NextResponse.json(created, { status: 201 });
}
