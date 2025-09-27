import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existing = await db
    .select({ id: newsletterSubscribers.id, unsubscribeToken: newsletterSubscribers.unsubscribeToken })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing.length > 0) {
    if (!existing[0].unsubscribeToken) {
      try {
        await db
          .update(newsletterSubscribers)
          .set({ unsubscribeToken: randomUUID() })
          .where(eq(newsletterSubscribers.id, existing[0].id));
      } catch (error) {
        console.error('Failed to backfill unsubscribe token', error);
      }
    }
    return NextResponse.json({ ok: true, status: 'already-subscribed' });
  }

  try {
    await db
      .insert(newsletterSubscribers)
      .values({ email, unsubscribeToken: randomUUID() })
      .onConflictDoNothing({ target: newsletterSubscribers.email });
  } catch (error) {
    console.error('Failed to store newsletter subscription', error);
    return NextResponse.json({ error: 'Could not save subscription.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: 'subscribed' });
}
