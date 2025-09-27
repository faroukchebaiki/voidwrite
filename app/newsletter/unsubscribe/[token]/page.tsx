import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { siteConfig } from '@/site';

export const metadata: Metadata = {
  title: `Unsubscribe — ${siteConfig.title}`,
  description: `Manage your ${siteConfig.title} newsletter subscription.`,
};

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trimmedToken = token.trim();

  let removed = false;
  if (trimmedToken) {
    const subscriber = await db
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.unsubscribeToken, trimmedToken))
      .limit(1);

    if (subscriber.length > 0) {
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, subscriber[0].id));
      removed = true;
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {removed ? 'You are unsubscribed' : 'Subscription not found'}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {removed
          ? `We’ve removed your email from the ${siteConfig.title} weekly digest list. You can resubscribe at any time from the homepage.`
          : `We couldn’t find an active subscription linked to this link. If you think this is a mistake, feel free to reach out through the contact page.`}
      </p>
      <div className="mt-8 flex justify-center gap-4 text-sm">
        <Link href="/" className="rounded-full border border-border px-4 py-2 text-foreground transition hover:bg-muted">
          Back to home
        </Link>
        <Link href="/contact" className="rounded-full border border-border px-4 py-2 text-foreground transition hover:bg-muted">
          Contact support
        </Link>
      </div>
    </main>
  );
}
