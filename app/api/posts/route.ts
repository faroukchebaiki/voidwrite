import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { createPostSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt ?? posts.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const now = new Date();
  const [created] = await db
    .insert(posts)
    .values({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      status: data.status,
      coverImageUrl: data.coverImageUrl || null,
      authorId: (user as any).id,
      publishedAt: data.status === "published" ? data.publishedAt ? new Date(data.publishedAt) : now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (data.tags && data.tags.length > 0) {
    const tagRows = await db.select().from(tags).where(inArray(tags.slug, data.tags));
    const pairs = tagRows.map((t) => ({ postId: created.id, tagId: t.id }));
    if (pairs.length) await db.insert(postTags).values(pairs).onConflictDoNothing();
  }

  return NextResponse.json(created, { status: 201 });
}
