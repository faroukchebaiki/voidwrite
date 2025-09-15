import type { Metadata } from 'next';
import './globals.css';
import '../styles/theme.css';
import { ThemeProvider } from 'next-themes';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@/lib/analytics';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Voidwrite Blog',
  description: 'A fast, modern blog built with Next.js + Drizzle + Auth.js',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('vw_theme')?.value as 'light'|'dark'|'system'|undefined;
  const initialClass = themeCookie === 'dark' ? 'dark' : themeCookie === 'light' ? '' : '';
  return (
    <html lang="en" suppressHydrationWarning className={initialClass}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          {children}
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
