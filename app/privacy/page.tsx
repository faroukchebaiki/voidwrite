import Link from 'next/link';

import { siteConfig } from '@/site';

export const metadata = {
  title: `${siteConfig.legal.privacyTitle} — ${siteConfig.title}`,
  description: siteConfig.legal.privacyDescription,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-4xl font-semibold text-foreground">{siteConfig.legal.privacyTitle}</h1>
      <p className="mt-4 text-muted-foreground">
        We respect the writers, editors, and readers who make {siteConfig.title} possible. This privacy policy
        explains what data we collect, why we collect it, and how we use it.
      </p>

      <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="font-semibold text-foreground">What we collect</h2>
          <p>
            When you create an account, we store your email address, name, and basic profile details so we can
            authenticate you and personalise the editorial workspace. We also log standard web analytics (page
            views, referrers, device information) to understand what content resonates.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">How we use your data</h2>
          <p>
            Your information powers features such as newsletters, editorial collaboration, and account recovery.
            We never sell your data, and we only share it with trusted providers that help us deliver the
            platform (for example, email, hosting, and analytics services).
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Cookies and preferences</h2>
          <p>
            We use cookies to remember your theme preferences, manage sessions, and keep the studio experience
            fast. You can clear cookies at any time, though some features may stop working until you sign in
            again.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Your choices</h2>
          <p>
            You can request a copy of your data, ask us to delete it, or update your profile from the studio
            settings. Email{' '}
            <a href={`mailto:${siteConfig.contact.email}`} className="underline">{siteConfig.contact.email}</a> if
            you have any questions or need help managing your privacy.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Updates</h2>
          <p>
            We will update this page whenever our practices change. Significant updates will be announced on the
            blog and via email to active contributors. The latest revision date is always displayed at the top of
            this page.
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Have more questions? <Link href="/contact" className="underline">Reach out</Link> and we&apos;ll get back to you.
      </p>
    </main>
  );
}
