"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();
  const hideFooter =
    pathname?.startsWith('/studio') ||
    pathname === '/signin' ||
    pathname === '/signup';
  if (hideFooter) return null;

  const year = new Date().getFullYear();
  const resourceLinks = [
    { href: '/privacy', label: 'Privacy Policy', external: false },
    { href: '/terms', label: 'Terms of Service', external: false },
    { href: '/rss.xml', label: 'RSS feed', external: true },
    { href: '/sitemap.xml', label: 'Sitemap', external: true },
  ];

  return (
    <footer className="mt-16 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="font-heading text-2xl font-semibold">Voidwrite</Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This blog is coded with ❤ by{' '}
              <a
                href="https://github.com/faroukchebaiki"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Farouk Chebaiki
              </a>
              . Built with Next.js and a rotating cast of modern tools. The code is open source—fork it, remix
              it, or use it as a springboard for your own ideas.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              © {year} Voidwrite.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {resourceLinks.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className="transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/contact" className="transition-colors hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/faroukchebaiki/voidwrite"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  GitHub repo
                </a>
              </li>
              <li>
                <a
                  href="mailto:me@farouk.uk"
                  className="transition-colors hover:text-foreground"
                >
                  me@farouk.uk
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Join us</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Want to publish or lend a hand?{' '}
              <Link href="/contact" className="underline">
                Reach out
              </Link>
              . Already part of Voidwrite?{' '}
              <Link href="/signin" className="underline">
                Sign in
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
