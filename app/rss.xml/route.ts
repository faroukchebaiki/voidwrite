import { NextResponse } from 'next/server';
import { fetchAllPosts, fetchSiteSettings } from '@/lib/sanity.queries';

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const [settings, posts] = await Promise.all([fetchSiteSettings(), fetchAllPosts()]);

  const items = posts
    .slice(0, 30)
    .map((p: any) => `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${origin}/posts/${p.slug.current}</link>
        <guid>${origin}/posts/${p.slug.current}</guid>
        ${p.excerpt ? `<description><![CDATA[${p.excerpt}]]></description>` : ''}
        ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ''}
      </item>
    `)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title><![CDATA[${settings?.siteTitle || 'Voidwrite'}]]></title>
      <link>${origin}</link>
      <description><![CDATA[${settings?.siteDescription || ''}]]></description>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=UTF-8' },
  });
}
