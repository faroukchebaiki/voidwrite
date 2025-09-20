import type { Metadata } from 'next';
import { Playfair_Display, Inter_Tight, UnifrakturCook } from 'next/font/google';
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

const headingFont = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });
const bodyFont = Inter_Tight({ subsets: ['latin'], variable: '--font-sans' });
const logoFont = UnifrakturCook({ subsets: ['latin'], variable: '--font-logo', weight: '700' });

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('vw_theme')?.value as 'light'|'dark'|'system'|undefined;
  const initialClass = themeCookie === 'dark' ? 'dark' : themeCookie === 'light' ? '' : '';
  const initialMode: 'light' | 'dark' = themeCookie === 'dark' ? 'dark' : 'light';
  const navTags = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(tags)
    .orderBy(sql`${tags.name}`);
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${headingFont.variable} ${bodyFont.variable} ${logoFont.variable} ${initialClass}`.trim()}
    >
      <body className="font-sans antialiased">
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
