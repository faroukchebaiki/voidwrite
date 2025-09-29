import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyPostViews, posts } from '@/db/schema';
import { requireStaff } from '@/lib/auth-helpers';

export async function GET(req: Request) {
  const user = await requireStaff();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const range = Number(url.searchParams.get('range') || '7');
  const all = await db.select().from(dailyPostViews);
  const postTotals = await db.select({ id: posts.id, views: posts.views }).from(posts);
  // Reduce across all posts by day
  const byDay = new Map<string, number>();
  for (const r of all as any[]) {
    byDay.set(r.day, (byDay.get(r.day) || 0) + Number(r.count || 0));
  }
  // Build last N days timeline
  const days: { day: string; count: number }[] = [];
  const today = new Date();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today.getTime()); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    days.push({ day: key, count: byDay.get(key) || 0 });
  }
  const totalViews = postTotals.reduce((sum, row) => sum + Number(row.views || 0), 0);
  if (totalViews > 0 && days.every((d) => d.count === 0)) {
    days[days.length - 1].count = totalViews;
  }
  return NextResponse.json(days);
}
