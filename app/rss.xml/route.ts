import { NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, settings } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const [site] = await db.select().from(settings).limit(1);
  const all = await db
    .select()
    .from(posts)
    .where(eq(posts.status, 'published' as any))
    .orderBy(desc(posts.publishedAt ?? posts.createdAt));

  const items = all
    .slice(0, 30)
    .map((p: any) => `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${origin}/posts/${p.slug}</link>
        <guid>${origin}/posts/${p.slug}</guid>
        ${p.excerpt ? `<description><![CDATA[${p.excerpt}]]></description>` : ''}
        ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ''}
      </item>
    `)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title><![CDATA[${site?.siteTitle || 'My Blog'}]]></title>
      <link>${origin}</link>
      <description><![CDATA[${site?.siteDescription || ''}]]></description>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=UTF-8' },
  });
}
