import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import ThemeRegistry from '@/components/ThemeRegistry';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Voidwrite Blog',
  description: 'A fast, modern blog built with Next.js + Sanity + MUI',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeRegistry>
            <div suppressHydrationWarning>
              <Header />
            </div>
            {children}
            <Footer />
          </ThemeRegistry>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
