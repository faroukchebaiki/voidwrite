import { NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, tags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { siteConfig } from '@/site';

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const configuredOrigin = siteConfig.url.replace(/\/$/, '');
  const origin = configuredOrigin || `${url.protocol}//${url.host}`;
  const [allPosts, allTags] = await Promise.all([
    db.select().from(posts).where(eq(posts.status, 'published' as any)),
    db.select().from(tags),
  ]);

  const uniqueUrls = new Set<string>();
  const normalize = (path: string) => `${origin}${path.startsWith('/') ? '' : '/'}${path.replace(/^\/+/, '')}`;

  siteConfig.staticRoutes.forEach((route) => uniqueUrls.add(normalize(route)));
  allPosts.forEach((p: any) => uniqueUrls.add(normalize(`/posts/${p.slug}`)));
  allTags.forEach((t: any) => uniqueUrls.add(normalize(`/tag/${t.slug}`)));

  const urls = Array.from(uniqueUrls);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map((loc) => `
        <url>
          <loc>${loc}</loc>
          <changefreq>weekly</changefreq>
        </url>
      `)
      .join('')}
  </urlset>`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
