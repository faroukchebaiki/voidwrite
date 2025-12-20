import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/db';
import { dailyPostViews, newsletterSubscribers, posts } from '@/db/schema';
import { siteConfig } from '@/site';
import { renderWeeklyDigestEmail } from '@/lib/newsletter';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const digestSecret = process.env.NEWSLETTER_DIGEST_SECRET;

const baseUrl = siteConfig.url.replace(/\/$/, '');

const formatDayKey = (date: Date) => date.toISOString().slice(0, 10);

const withinRange = (value: Date | null, start: Date, end: Date) => {
  if (!value) return false;
  return value >= start && value <= end;
};

export async function POST(request: Request) {
  if (!digestSecret || digestSecret.length === 0) {
    return NextResponse.json({ error: 'NEWSLETTER_DIGEST_SECRET is not configured.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${digestSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ error: 'Resend API key is not configured.' }, { status: 500 });
  }

  const subscribers = await db
    .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email, unsubscribeToken: newsletterSubscribers.unsubscribeToken })
    .from(newsletterSubscribers);
  if (subscribers.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no-subscribers' });
  }

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const days: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(formatDayKey(cursor));
  }

  const limit = Math.min(7, Math.max(1, siteConfig.newsletter.postsPerDigest));
  const totalViews = sql<number>`sum(${dailyPostViews.count})`.as('total_views');
  const leaderboard = await db
    .select({ postId: dailyPostViews.postId, total: totalViews })
    .from(dailyPostViews)
    .where(inArray(dailyPostViews.day, days))
    .groupBy(dailyPostViews.postId)
    .orderBy(desc(totalViews))
    .limit(limit);

  type Row = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    publishedAt: Date | null;
    views: number;
    trashed?: boolean;
    status?: any;
  };

  let rows: Row[] = [];
  if (leaderboard.length > 0) {
    const postIds = leaderboard.map((entry) => entry.postId);
    const postRows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImageUrl: posts.coverImageUrl,
        publishedAt: posts.publishedAt,
        views: posts.views,
        trashed: posts.trashed,
        status: posts.status,
      })
      .from(posts)
      .where(inArray(posts.id, postIds));

    const map = new Map<number, Row>();
    postRows.forEach((row) => {
      if (!row.trashed && row.status === ('published' as any)) {
        map.set(row.id, row);
      }
    });

    rows = leaderboard
      .map((entry) => {
        const row = map.get(entry.postId);
        if (!row) return null;
        return {
          ...row,
          views: typeof entry.total === 'number' ? entry.total : row.views,
        } as Row;
      })
      .filter((row): row is Row => Boolean(row));
  }

  if (rows.length === 0) {
    rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImageUrl: posts.coverImageUrl,
        publishedAt: posts.publishedAt,
        views: posts.views,
      })
      .from(posts)
      .where(
        and(
          eq(posts.status, 'published' as any),
          gte(posts.publishedAt, start),
          lte(posts.publishedAt, end),
        ),
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit) as Row[];
  }

  const digestPosts = rows
    .filter((row) => withinRange(row.publishedAt, start, end))
    .map((row) => ({
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      coverImageUrl: row.coverImageUrl,
      publishedAt: row.publishedAt,
      views: row.views ?? 0,
    }));

  if (digestPosts.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no-new-posts' });
  }

  const rangeLabel = `${start.toLocaleDateString(siteConfig.locale, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(siteConfig.locale, { month: 'short', day: 'numeric' })}`;
  const fromEmail = process.env.NEWSLETTER_FROM_ADDRESS || siteConfig.newsletter.fromEmail;
  const replyTo = siteConfig.newsletter.replyTo || process.env.NEWSLETTER_REPLY_TO || undefined;
  const subject = `${siteConfig.newsletter.digestSubject} (${rangeLabel})`;

  const results: Array<{ email: string; delivered: boolean; error?: string }> = [];
  for (const subscriber of subscribers) {
    let token = subscriber.unsubscribeToken?.trim();
    if (!token) {
      token = randomUUID();
      try {
        await db
          .update(newsletterSubscribers)
          .set({ unsubscribeToken: token })
          .where(eq(newsletterSubscribers.id, subscriber.id));
      } catch (error) {
        console.error('Failed to backfill unsubscribe token', error);
        results.push({ email: subscriber.email, delivered: false, error: 'missing unsubscribe token' });
        continue;
      }
    }
    const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe/${token}`;
    const { html, text } = renderWeeklyDigestEmail(digestPosts, { rangeLabel, unsubscribeUrl });
    try {
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: subscriber.email,
        subject,
        html,
        text,
        replyTo,
      });
      if (error) {
        results.push({ email: subscriber.email, delivered: false, error: error.message });
      } else {
        results.push({ email: subscriber.email, delivered: true });
      }
    } catch (error: any) {
      console.error('Failed to send weekly digest', error);
      results.push({ email: subscriber.email, delivered: false, error: error?.message || 'unknown error' });
    }
  }

  const delivered = results.filter((r) => r.delivered).length;
  return NextResponse.json({ ok: true, delivered, total: subscribers.length, results }, { status: 200 });
}
