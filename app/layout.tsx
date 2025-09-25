import type { Metadata } from 'next';
import './globals.css';
import '../styles/theme.css';
import { ThemeProvider } from 'next-themes';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@/lib/analytics';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { siteConfig } from '@/site';

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('vw_theme')?.value as 'light'|'dark'|'system'|undefined;
  const initialClass = themeCookie === 'dark' ? 'dark' : themeCookie === 'light' ? '' : '';
  const initialMode: 'light' | 'dark' = themeCookie === 'dark' ? 'dark' : 'light';
  let navTags: { name: string | null; slug: string | null }[] = [];
  if (process.env.DATABASE_URL) {
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
          <Header
            siteTitle={siteConfig.title}
            tags={navTags
              .map((t) => ({ name: (t.name ?? t.slug) ?? '', slug: t.slug ?? '' }))
              .filter((t) => t.slug)}
            initialMode={initialMode}
          />
          {children}
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
