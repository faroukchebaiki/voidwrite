"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { useTheme } from 'next-themes';
import { Facebook, Instagram, Moon, Sun, Twitter, Youtube } from 'lucide-react';

import { buttonVariants, Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HeaderProps = {
  siteTitle: string;
  tags: { name: string; slug: string }[];
  initialMode: 'light' | 'dark';
};

type SocialLink = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const PinterestIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M11.2 18.5 12.8 12M12.8 12H14a2.5 2.5 0 0 0 0-5H10v7" />
  </svg>
);

const SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://facebook.com/voidwrite', label: 'Facebook', icon: Facebook },
  { href: 'https://instagram.com/voidwrite', label: 'Instagram', icon: Instagram },
  { href: 'https://pinterest.com/voidwrite', label: 'Pinterest', icon: PinterestIcon },
  { href: 'https://youtube.com/@voidwrite', label: 'YouTube', icon: Youtube },
  { href: 'https://twitter.com/voidwrite', label: 'X', icon: Twitter },
];

export default function Header({ siteTitle, tags, initialMode }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme, systemTheme } = useTheme();
  const isStudio = pathname?.startsWith('/studio');
  const [mounted, setMounted] = useState(false);
  const [showBrand, setShowBrand] = useState(true);
  const showBrandRef = useRef(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const setBrandVisibility = (visible: boolean) => {
    if (showBrandRef.current === visible) return;
    showBrandRef.current = visible;
    setShowBrand(visible);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const TOP_THRESHOLD = 80;
    const DOWN_THRESHOLD = 24;
    const UP_THRESHOLD = 16;
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const lastY = lastScrollY.current;
        if (currentY <= TOP_THRESHOLD) {
          setBrandVisibility(true);
        } else if (currentY < lastY - UP_THRESHOLD) {
          setBrandVisibility(true);
        } else if (currentY > lastY + DOWN_THRESHOLD && currentY > TOP_THRESHOLD) {
          setBrandVisibility(false);
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    showBrandRef.current = true;
    setShowBrand(true);
    if (typeof window !== 'undefined') {
      lastScrollY.current = window.scrollY;
    }
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (!mounted) return initialMode;
    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    return resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [mounted, theme, systemTheme, initialMode]);

  const setCookieTheme = (val: 'light' | 'dark' | 'system') => {
    try {
      document.cookie = `vw_theme=${val}; Max-Age=${60 * 60 * 24 * 365}; Path=/`;
    } catch {
      /* ignore cookie write errors */
    }
  };
  const toggleTheme = () => {
    const next = resolvedMode === 'dark' ? 'light' : 'dark';
    setCookieTheme(next);
    setTheme(next);
  };

  const navItems = useMemo(() => {
    const base = [{ label: 'Home', href: '/' }];
    const tagItems = tags.map((tag) => ({ label: tag.name, href: `/tag/${tag.slug}` }));
    return [...base, ...tagItems];
  }, [tags]);

  if (isStudio) return null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4">
        <div
          className={cn(
            'flex flex-col gap-4 overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out',
            showBrand ? 'max-h-40 translate-y-0 opacity-100 py-6' : 'pointer-events-none max-h-0 -translate-y-3 opacity-0'
          )}
          aria-hidden={!showBrand}
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <Link href="/" className="font-logo text-4xl text-foreground sm:text-5xl" aria-label={`${siteTitle} home`}>
              {siteTitle || 'Voidwrite'}
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <nav
          className={cn(
            'flex items-center gap-2 overflow-x-auto border-t border-border/60 text-sm transition-all duration-200',
            showBrand ? 'py-3' : 'py-2'
          )}
        >
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'rounded-full px-4 font-medium transition-colors',
                  isActive && 'bg-accent text-accent-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="ml-auto flex items-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {resolvedMode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
