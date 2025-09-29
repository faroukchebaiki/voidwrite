import Link from 'next/link';

import { siteConfig } from '@/site';

export const metadata = {
  title: `${siteConfig.legal.termsTitle} — ${siteConfig.title}`,
  description: siteConfig.legal.termsDescription,
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-4xl font-semibold text-foreground">{siteConfig.legal.termsTitle}</h1>
      <p className="mt-4 text-muted-foreground">
        These terms keep {siteConfig.title} running smoothly for contributors, editors, and readers alike. By using the
        site you agree to the responsibilities outlined here.
      </p>

      <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="font-semibold text-foreground">Your content</h2>
          <p>
            You retain ownership of anything you publish on {siteConfig.title}. By submitting work, you grant us a
            non-exclusive license to host, display, and distribute it on our platforms. You are responsible for
            ensuring your content does not infringe on anyone else&apos;s rights.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Editorial guidelines</h2>
          <p>
            We reserve the right to edit or decline submissions that don&apos;t meet our quality bar or community
            guidelines. Collaborative changes will always be discussed with the original author before
            publishing.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Accounts and access</h2>
          <p>
            Keep your login credentials secure. Team members with studio access must use two-factor authentication
            when available. We may revoke access for misuse or security concerns.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Third-party services</h2>
          <p>
            {siteConfig.title} relies on trusted providers for hosting, analytics, and communication. Their respective
            terms also apply; we list them in the privacy policy. We only work with services that align with our
            values and security standards.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Changes</h2>
          <p>
            We may update these terms to reflect new features or legal requirements. Significant changes will be
            announced on the blog, and continued use of {siteConfig.title} constitutes acceptance of the updated terms.
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Questions or concerns? <Link href="/contact" className="underline">Contact us</Link> and we&apos;ll help you out.
      </p>
    </main>
  );
}
