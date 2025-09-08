import { NextResponse } from 'next/server';
import { fetchAllPosts, fetchAllTags } from '@/lib/sanity.queries';

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const [posts, tags] = await Promise.all([fetchAllPosts(), fetchAllTags()]);

  const urls: string[] = [
    `${origin}/`,
    ...posts.map((p: any) => `${origin}/posts/${p.slug.current}`),
    ...tags.map((t: any) => `${origin}/tag/${t.slug.current}`),
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
