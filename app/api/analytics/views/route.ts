import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyPostViews } from '@/db/schema';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = Number(url.searchParams.get('range') || '7');
  const all = await db.select().from(dailyPostViews);
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
  return NextResponse.json(days);
}

