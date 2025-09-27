"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react';
import { useTheme } from 'next-themes';
import { Facebook, Instagram, Moon, Sun, Twitter, Youtube, Search, X, Menu, Home } from 'lucide-react';
import { siteConfig } from '@/site';

import { buttonVariants, Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme, systemTheme } = useTheme();
  const hideHeader =
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname?.startsWith('/studio');
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const currentYear = useMemo(() => new Date().getFullYear(), []);

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
    return tags.map((tag) => ({ label: tag.name ?? tag.slug ?? '', href: `/tag/${tag.slug}` }));
  }, [tags]);

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (sheetOpen) {
      setSearchOpen(false);
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const current = searchParams?.get('q') ?? '';
    setSearchValue(current);
  }, [searchOpen, searchParams]);

  
const runHomeSearch = useCallback(
  async (value: string) => {
    const q = value.trim();
    const res = await fetch(`/api/posts/search${q ? `?q=${encodeURIComponent(q)}` : ''}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to run search');
    const data = await res.json();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('voidwrite:home-search', {
          detail: {
            query: q,
            posts: data.posts ?? [],
            authors: data.authors ?? [],
          },
        })
      );
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (q) params.set('q', q); else params.delete('q');
      const url = params.toString() ? `/?${params.toString()}` : '/';
      window.history.replaceState(null, '', url);
    }
  },
  [searchParams]
);

const submitSearch = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const q = searchValue.trim();
  if (pathname === '/') {
    try {
      await runHomeSearch(q);
    } catch (error) {
      console.error(error);
    }
    return;
  }
  const params = new URLSearchParams(searchParams?.toString() ?? '');
  if (q) params.set('q', q); else params.delete('q');
  router.push(`/?${params.toString()}`);
  setSearchOpen(false);
};

  useEffect(() => {
    if (sheetOpen) {
      setSearchOpen(false);
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchOpen]);

  useEffect(() => {
    if (sheetOpen) {
      setSearchOpen(false);
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.setTimeout(() => {
      const prefersDesktop = window.matchMedia('(min-width: 640px)').matches;
      const primaryId = prefersDesktop ? 'header-search-input' : 'header-search-input-mobile';
      const fallbackId = prefersDesktop ? 'header-search-input-mobile' : 'header-search-input';
      const target = (document.getElementById(primaryId) ?? document.getElementById(fallbackId)) as HTMLInputElement | null;
      target?.focus();
    }, 60);
    return () => window.clearTimeout(id);
  }, [searchOpen]);

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
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Open menu"
                  className="rounded-full sm:hidden"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs bg-background/90 backdrop-blur">
                <SheetTitle className="sr-only">{siteTitle || 'Voidwrite'} navigation</SheetTitle>
                <div className="flex h-full flex-col gap-6 overflow-y-auto py-4">
                  <div className="space-y-2 text-center">
                    <Link
                      href="/"
                      onClick={() => setSheetOpen(false)}
                      className="block font-logo text-4xl text-foreground"
                    >
                      {siteTitle || 'Voidwrite'}
                    </Link>
                    {siteConfig.tagline ? (
                      <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
                    ) : null}
                  </div>
                  {SOCIAL_LINKS.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                        <a
                          key={href}
                          href={href}
                          aria-label={label}
                          target="_blank"
                          rel="noreferrer"
                          className="flex size-10 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                          onClick={() => setSheetOpen(false)}
                        >
                          <Icon className="size-4" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <nav className="flex flex-col gap-2">
                      <Link
                        href="/"
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'justify-start rounded-2xl border border-transparent px-4 py-3 text-base font-semibold transition-colors hover:border-border/70 hover:bg-muted/60',
                          pathname === '/' && 'border-border bg-muted/70 text-foreground'
                        )}
                      >
                        <span className="flex items-center gap-3"><Home className="size-4" /> Home</span>
                      </Link>
                      {navItems.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSheetOpen(false)}
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'sm' }),
                              'justify-start rounded-2xl border border-transparent px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:border-border/70 hover:bg-muted/60 hover:text-foreground',
                              isActive && 'border-border bg-muted/70 text-foreground'
                            )}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="mt-auto space-y-2 text-center text-xs text-muted-foreground">
                    <p>© {currentYear} {siteTitle || 'Voidwrite'}</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link
              href="/"
              aria-label="Home"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'rounded-full sm:hidden'
              )}
            >
              <Home className="size-4" aria-hidden />
            </Link>
            <Link
              href="/"
              aria-label="Home"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'hidden rounded-full sm:flex',
                pathname === '/' && 'bg-accent text-accent-foreground'
              )}
            >
              <Home className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="hidden flex-1 items-center gap-2 sm:flex">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
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
          </div>
          <div className="ml-auto flex items-center gap-0 sm:gap-2">
            <form
              onSubmit={submitSearch}
              className="hidden h-9 min-w-0 flex-shrink items-center gap-2 overflow-hidden rounded-full border border-border/60 bg-background text-sm shadow-sm transition-all duration-200 sm:flex"
              style={{
                width: searchOpen ? 'min(320px, calc(100vw - 28rem))' : 0,
                opacity: searchOpen ? 1 : 0,
                marginRight: searchOpen ? 12 : 0,
                paddingLeft: searchOpen ? 14 : 0,
                paddingRight: searchOpen ? 14 : 0,
                pointerEvents: searchOpen ? 'auto' : 'none',
              }}
            >
              <Search className="size-4 flex-shrink-0 text-muted-foreground" aria-hidden />
              <input
                id="header-search-input"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search posts…"
                className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search posts"
              />
              <button
                type="button"
                className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </form>
            <form
              onSubmit={submitSearch}
              className="flex h-9 min-w-0 flex-shrink items-center gap-2 overflow-hidden rounded-full border border-border/60 bg-background text-sm shadow-sm transition-all duration-200 sm:hidden"
              style={{
                width: searchOpen ? 'min(calc(100vw - 11rem), 13rem)' : 0,
                opacity: searchOpen ? 1 : 0,
                marginRight: searchOpen ? 8 : 0,
                paddingLeft: searchOpen ? 14 : 0,
                paddingRight: searchOpen ? 14 : 0,
                pointerEvents: searchOpen ? 'auto' : 'none',
              }}
            >
              <Search className="size-4 flex-shrink-0 text-muted-foreground" aria-hidden />
              <input
                id="header-search-input-mobile"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search posts…"
                className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search posts"
              />
              <button
                type="button"
                className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </form>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label="Toggle search"
              className={cn('rounded-full flex-shrink-0 sm:hidden', searchOpen && 'hidden')}
            >
              {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
            </Button>
            {!searchOpen && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="hidden rounded-full sm:flex"
              >
                <Search className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full flex-shrink-0"
            >
              {resolvedMode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
