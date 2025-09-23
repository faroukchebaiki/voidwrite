import { NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, dailyPostViews } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body?.slug || '');
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

    const [row] = await db.select().from(posts).where(eq(posts.slug, slug));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const cookieName = `vw_${row.id}`;
    const cookiesHeader = req.headers.get('cookie') || '';
    const hasCookie = cookiesHeader.split(/;\s*/).some((c) => c.startsWith(`${cookieName}=`));
    if (hasCookie) return NextResponse.json({ id: row.id, views: row.views ?? 0 });

    const [updated] = await db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` as any })
      .where(eq(posts.id, row.id))
      .returning({ id: posts.id, views: posts.views });
    // Upsert daily count
    const day = new Date().toISOString().slice(0,10);
    const inserted = await db
      .insert(dailyPostViews)
      .values({ postId: row.id, day, count: 1 })
      .onConflictDoNothing()
      .returning({ postId: dailyPostViews.postId });
    if (inserted.length === 0) {
      await db
        .update(dailyPostViews)
        .set({ count: sql`${dailyPostViews.count} + 1` })
        .where(and(eq(dailyPostViews.postId, row.id), eq(dailyPostViews.day, day)));
    }

    const res = NextResponse.json(updated);
    const maxAge = 60 * 60 * 24; // 1 day
    res.headers.append('Set-Cookie', `${cookieName}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`);
    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
