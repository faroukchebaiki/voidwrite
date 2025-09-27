import { siteConfig } from '@/site';
import { renderBrandedEmail, renderPlainTextEmail } from '@/lib/emails';

export type DigestPost = {
  title: string;
  slug: string;
  excerpt?: string | null;
  views: number;
  coverImageUrl?: string | null;
  publishedAt?: Date | null;
};

const baseUrl = siteConfig.url.replace(/\/$/, '');

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith('/')) return `${baseUrl}/${value}`;
  return `${baseUrl}${value}`;
};

export function renderWeeklyDigestEmail(posts: DigestPost[], opts: { rangeLabel: string; unsubscribeUrl?: string }) {
  const accent = '#6366f1';
  const heading = siteConfig.newsletter.digestSubject;
  const intro = posts.length
    ? `Here’s what readers vibed with from ${opts.rangeLabel}.`
    : `We’re keeping a low profile this week, but we’ll be back next Friday with more stories to share.`;

  const cards = posts
    .map((post, index) => {
      const cover = toAbsoluteUrl(post.coverImageUrl) ?? toAbsoluteUrl(siteConfig.branding.ogImage);
      const postUrl = `${baseUrl}/posts/${post.slug}`;
      const position = index + 1;
      const excerpt = post.excerpt?.trim() || 'Tap through to read the full story on Voidwrite.';
      const published = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString(siteConfig.locale, { month: 'short', day: 'numeric', year: 'numeric' })
        : undefined;

      return `
        <div style="margin:0 0 16px; padding:20px 24px; border-radius:18px; background:#f9fafb; border:1px solid #e5e7eb;">
          <div style="display:flex; align-items:center; gap:12px; font-size:13px; letter-spacing:0.25em; text-transform:uppercase; color:#6b7280;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:999px; background:${accent}; color:#fff; font-weight:700;">${position}</span>
            <span>${published ?? 'Popular this week'}</span>
          </div>
          <h2 style="margin:18px 0 12px; font-size:20px; color:#111827; line-height:1.4;">${escapeHtml(post.title)}</h2>
          ${cover ? `<img src="${cover}" alt="${escapeHtml(post.title)}" style="width:100%; max-height:220px; object-fit:cover; border-radius:14px; margin:0 0 16px;" />` : ''}
          <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:#374151;">${escapeHtml(excerpt)}</p>
          <a href="${postUrl}" style="display:inline-block; padding:12px 20px; border-radius:999px; background:${accent}; color:#fff; font-weight:600; text-decoration:none;">Read the story</a>
        </div>
      `;
    })
    .join('');

  const content = posts.length
    ? `<div style="display:flex; flex-direction:column; gap:12px;">${cards}</div>`
    : `<p style="font-size:15px; line-height:1.7; color:#374151;">No new posts cracked the charts this week, but we’re in the studio working on more to share soon.</p>`;

  const footerNote = opts.unsubscribeUrl
    ? `Sent from ${siteConfig.title}. <a href="${opts.unsubscribeUrl}" style="color:${accent}; text-decoration:none; font-weight:600;">Unsubscribe</a>.`
    : `Sent from ${siteConfig.title}. You can unsubscribe anytime.`;

  const html = renderBrandedEmail({ heading, intro, content, footerNote });

  const textLines = posts.length
    ? posts.map((post, index) => `${index + 1}. ${post.title} — ${baseUrl}/posts/${post.slug}`)
    : ['Quiet week, but more stories are in the works.'];
  const text = renderPlainTextEmail({
    heading,
    bodyLines: [intro, '', ...textLines, opts.unsubscribeUrl ? `Unsubscribe: ${opts.unsubscribeUrl}` : ''],
    footerNote: `Sent from ${siteConfig.title}.`,
  });

  return { html, text };
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
