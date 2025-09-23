"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react';
import { useTheme } from 'next-themes';
import { Facebook, Instagram, Moon, Sun, Twitter, Youtube, Home } from 'lucide-react';
import { siteConfig } from '@/site';

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
  siteConfig.social.facebook ? { href: siteConfig.social.facebook, label: 'Facebook', icon: Facebook } : null,
  siteConfig.social.instagram ? { href: siteConfig.social.instagram, label: 'Instagram', icon: Instagram } : null,
  siteConfig.social.pinterest ? { href: siteConfig.social.pinterest, label: 'Pinterest', icon: PinterestIcon } : null,
  siteConfig.social.youtube ? { href: siteConfig.social.youtube, label: 'YouTube', icon: Youtube } : null,
  siteConfig.social.twitter ? { href: siteConfig.social.twitter, label: 'X', icon: Twitter } : null,
].filter(Boolean) as SocialLink[];

export default function Header({ siteTitle, tags, initialMode }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme, systemTheme } = useTheme();
  const hideHeader = pathname === '/signin' || pathname === '/signup' || pathname?.startsWith('/studio');
  const [mounted, setMounted] = useState(false);

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

  type NavItem = { label: string; href: string; icon?: typeof Home };
  const navItems: NavItem[] = useMemo(() => {
    const base: NavItem[] = [{ label: 'Home', href: '/', icon: Home }];
    const tagItems: NavItem[] = tags.map((tag) => ({ label: tag.name ?? tag.slug ?? '', href: `/tag/${tag.slug}` }));
    return [...base, ...tagItems];
  }, [tags]);

  if (hideHeader) return null;

  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
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
      </header>
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 text-sm">
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
                <span className="flex items-center gap-2">
                  {item.icon ? <item.icon className="size-4" aria-hidden /> : null}
                  {!item.icon && <span>{item.label}</span>}
                </span>
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
        </div>
      </nav>
    </>
  );
}
