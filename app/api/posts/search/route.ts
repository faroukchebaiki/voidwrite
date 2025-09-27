import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

function buildPattern(query: string) {
  return `%${query.replace(/[%_]/g, (match) => `\\${match}`)}%`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();

  const where: any[] = [eq(posts.status as any, 'published' as any)];
  if (q) {
    const pattern = buildPattern(q.toLowerCase());
    where.push(
      or(
        ilike(posts.title, pattern),
        ilike(posts.excerpt, pattern)
      )
    );
  }

  const rows = await db
    .select()
    .from(posts)
    .where(where.length > 1 ? and(...where) : where[0])
    .orderBy(desc(posts.publishedAt ?? posts.createdAt));

  const authorIds = Array.from(new Set(rows.map((p) => p.authorId).filter(Boolean))) as string[];
  const authorProfiles = authorIds.length
    ? await db
        .select({ userId: profiles.userId, firstName: profiles.firstName, lastName: profiles.lastName })
        .from(profiles)
        .where(inArray(profiles.userId, authorIds))
    : [];
  const authorUsers = authorIds.length
    ? await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, authorIds))
    : [];

  const authorEntries: [string, string][] = [];
  const seen = new Set<string>();
  for (const profile of authorProfiles) {
    const key = profile.userId;
    if (!key || seen.has(key)) continue;
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    if (name) {
      authorEntries.push([key, name]);
      seen.add(key);
    }
  }
  for (const user of authorUsers) {
    const key = user.id;
    if (!key || seen.has(key)) continue;
    const fallback = user.name || user.email || '';
    if (fallback) {
      authorEntries.push([key, fallback]);
      seen.add(key);
    }
  }

  const serialized = rows.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    views: Number(post.views ?? 0),
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt ? post.createdAt.toISOString() : null,
    authorId: post.authorId,
  }));

  return NextResponse.json({ posts: serialized, authors: authorEntries });
}
