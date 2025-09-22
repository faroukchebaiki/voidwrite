"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Footer() {
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith('/studio') || pathname === '/signin' || pathname === '/signup';
  if (hideFooter) return null;
  return (
    <footer className="mt-16 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="font-heading text-2xl font-semibold">Voidwrite</Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A publication for curious creatives, builders, and storytellers.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              © {new Date().getFullYear()} Voidwrite. Crafted with Next.js.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Latest posts
                </Link>
              </li>
              <li>
                <Link href="/tag/news" className="transition-colors hover:text-foreground">
                  News &amp; updates
                </Link>
              </li>
              <li>
                <Link href="/tag/tips" className="transition-colors hover:text-foreground">
                  Guides &amp; tips
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:hello@voidwrite.local"
                  className="transition-colors hover:text-foreground"
                >
                  hello@voidwrite.local
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/faroukchebaiki"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://voidwrite.example/social"
                  className="transition-colors hover:text-foreground"
                >
                  Community
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Join us</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ready to publish with Voidwrite? Access the studio to pitch your next story.
            </p>
            <Link
              href="/studio"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}
            >
              Go to studio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
