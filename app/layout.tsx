import type { Metadata, Viewport } from 'next';
import './globals.css';
import '../styles/theme.css';
import { ThemeProvider } from 'next-themes';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';
import { cookies, headers } from 'next/headers';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { siteConfig } from '@/site';

const siteUrl = siteConfig.url.replace(/\/$/, '');
const metadataBase = new URL(siteConfig.url);
const ogImageUrl = siteConfig.branding.ogImage.startsWith('http')
  ? siteConfig.branding.ogImage
  : `${siteUrl}${siteConfig.branding.ogImage.startsWith('/') ? '' : '/'}${siteConfig.branding.ogImage}`;
const twitterHandle = (() => {
  const handle = siteConfig.author.twitter;
  if (!handle) return undefined;
  if (handle.startsWith('@')) return handle;
  return `@${handle.replace(/^https?:\/\/(www\.)?twitter\.com\//, '').replace(/\/.*/, '')}`;
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.title}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.title,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  category: 'Technology',
  alternates: {
    canonical: siteConfig.url,
    types: {
      'application/rss+xml': `${siteUrl}/rss.xml`,
    },
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${siteConfig.title} social preview`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    creator: twitterHandle,
    site: twitterHandle,
    images: [ogImageUrl],
  },
  icons: {
    shortcut: '/favicon.ico',
  },
  other: {
    tagline: siteConfig.tagline,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: siteConfig.branding.themeColorLight },
    { media: '(prefers-color-scheme: dark)', color: siteConfig.branding.themeColorDark },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('vw_theme')?.value as 'light'|'dark'|'system'|undefined;
  const initialClass = themeCookie === 'dark' ? 'dark' : themeCookie === 'light' ? '' : '';
  const initialMode: 'light' | 'dark' = themeCookie === 'dark' ? 'dark' : 'light';
  const headerList = await headers();
  const matchedPath = headerList.get('x-matched-path') || headerList.get('next-url') || '/';
  let pathname = matchedPath;
  if (!matchedPath.startsWith('/')) {
    try {
      pathname = new URL(matchedPath, 'http://localhost').pathname;
    } catch {
      pathname = '/';
    }
  }
  const hideChrome = pathname === '/suspended';

  let navTags: { name: string | null; slug: string | null }[] = [];
  if (!hideChrome && process.env.DATABASE_URL) {
    try {
      navTags = await db
        .select({ name: tags.name, slug: tags.slug })
        .from(tags)
        .orderBy(sql`${tags.name}`);
    } catch {
      console.warn('Navigation tags unavailable, continuing without tags.');
    }
  }
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={initialClass || undefined}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {!hideChrome && (
            <Header
              siteTitle={siteConfig.title}
              tags={navTags
                .map((t) => ({ name: (t.name ?? t.slug) ?? '', slug: t.slug ?? '' }))
                .filter((t) => t.slug)}
              initialMode={initialMode}
            />
          )}
          {children}
          {!hideChrome && <Footer />}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
