import { NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, tags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const [allPosts, allTags] = await Promise.all([
    db.select().from(posts).where(eq(posts.status, 'published' as any)),
    db.select().from(tags),
  ]);

  const urls: string[] = [
    `${origin}/`,
    ...allPosts.map((p: any) => `${origin}/posts/${p.slug}`),
    ...allTags.map((t: any) => `${origin}/tag/${t.slug}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map((loc) => `
        <url>
          <loc>${loc}</loc>
        </url>
      `)
      .join('')}
  </urlset>`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
