import { NextResponse } from 'next/server';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { siteConfig } from '@/site';

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const configuredOrigin = siteConfig.url.replace(/\/$/, '');
  const origin = configuredOrigin || `${url.protocol}//${url.host}`;
  const feedUrl = `${origin}/rss.xml`;
  const limit = Math.max(1, siteConfig.feed.limit ?? 30);
  const all = await db
    .select()
    .from(posts)
    .where(eq(posts.status, 'published' as any))
    .orderBy(desc(posts.publishedAt ?? posts.createdAt));

  const items = all
    .slice(0, limit)
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
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title><![CDATA[${siteConfig.feed.title || siteConfig.title}]]></title>
      <link>${origin}</link>
      <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
      <description><![CDATA[${siteConfig.feed.description || siteConfig.description}]]></description>
      <language>${siteConfig.locale}</language>
      ${siteConfig.author.email ? `<managingEditor>${siteConfig.author.email} (${siteConfig.author.name})</managingEditor>` : ''}
      ${siteConfig.author.email ? `<webMaster>${siteConfig.author.email} (${siteConfig.author.name})</webMaster>` : ''}
      ${siteConfig.branding.ogImage ? `<image><url>${siteConfig.branding.ogImage.startsWith('http') ? siteConfig.branding.ogImage : `${origin}${siteConfig.branding.ogImage.startsWith('/') ? '' : '/'}${siteConfig.branding.ogImage}`}</url><title><![CDATA[${siteConfig.title}]]></title><link>${origin}</link></image>` : ''}
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=UTF-8' },
  });
}
