import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { db } from "@/db";
import { posts, tags, profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/site";
import { summarizeExcerpt } from "@/lib/text";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published" as any))
    .orderBy(desc(posts.publishedAt ?? posts.createdAt));
  const allTags = await db.select().from(tags).orderBy(sql`${tags.name}`);
  const authorIds = Array.from(new Set(allPosts.map((p) => p.authorId).filter(Boolean))) as string[];
  let authorProfiles: { userId: string; firstName: string | null; lastName: string | null }[] = [];
  let authorUsers: { id: string; name: string | null; email: string | null }[] = [];
  if (authorIds.length) {
    authorProfiles = await db
      .select({ userId: profiles.userId, firstName: profiles.firstName, lastName: profiles.lastName })
      .from(profiles)
      .where(inArray(profiles.userId, authorIds));
    authorUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, authorIds));
  }
  const authorNameMap = new Map<string, string>();
  for (const profile of authorProfiles) {
    const formatted = toTitleCase([profile.firstName, profile.lastName].filter(Boolean).join(' '));
    if (formatted) authorNameMap.set(profile.userId, formatted);
  }
  for (const user of authorUsers) {
    if (authorNameMap.has(user.id)) continue;
    const formatted = toTitleCase(user.name || '') || user.email || '';
    if (formatted) authorNameMap.set(user.id, formatted);
  }
  const paramsObj = (await searchParams) || {};
  const qParam = paramsObj.q;
  const pageParam = paramsObj.page;
  const q = (qParam || "").toLowerCase();
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const filtered = q
    ? allPosts.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q)
      )
    : allPosts;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered.slice(start, end);
  const numberFormatter = new Intl.NumberFormat();
  const remoteHosts = new Set(['public.blob.vercel-storage.com', 'p06e0neae38vv52o.public.blob.vercel-storage.com']);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section className="space-y-6">
          {paged.map((p) => {
            const publishedDate = p.publishedAt ? new Date(p.publishedAt) : p.createdAt ? new Date(p.createdAt) : null;
            const dateLabel = publishedDate?.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const displayDate = dateLabel ?? 'Coming soon';
            const imageSrc = (() => {
              if (p.coverImageUrl) {
                if (p.coverImageUrl.startsWith('/')) return p.coverImageUrl;
                try {
                  const url = new URL(p.coverImageUrl);
                  if (remoteHosts.has(url.hostname)) return p.coverImageUrl;
                } catch {
                  return '/image.png';
                }
              }
              return '/image.png';
            })();
            const excerptPreview = summarizeExcerpt(p.excerpt);
            const authorName = authorNameMap.get(p.authorId) || siteConfig.title;

            return (
              <Link
                key={p.id}
                href={`/posts/${p.slug}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
              >
                <Card className="font-roboto overflow-hidden border border-border/60 p-0 shadow-none transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div className="relative h-48 w-full overflow-hidden sm:h-56 lg:h-60">
                    <Image
                      src={imageSrc}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1280px) 640px, (min-width: 1024px) 520px, (min-width: 640px) 60vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      priority={false}
                    />
                  </div>
                  <div className="flex flex-col justify-between bg-card">
                    <div className="flex flex-col gap-5 px-6 py-6">
                      <div className="flex flex-wrap items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{displayDate}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{numberFormatter.format(p.views ?? 0)} views</span>
                      </div>
                      <h2 className="text-2xl font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary sm:text-3xl">
                        {p.title}
                      </h2>
                      {excerptPreview ? (
                        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                          {excerptPreview}
                        </p>
                      ) : null}
                    </div>
                    <CardFooter className="border-t border-border/60 bg-card/80 px-6 py-4 pt-4 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground justify-between">
                      <span>{authorName}</span>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform duration-200 group-hover:translate-x-1">
                        Read article
                        <ArrowRight className="size-4" />
                      </span>
                    </CardFooter>
                  </div>
                </Card>
              </Link>
            );
          })}
          {paged.length === 0 && (
            <Card className="border-dashed text-center text-sm text-muted-foreground">
              <CardHeader>
                <CardTitle className="text-lg">No posts found</CardTitle>
                <CardDescription>
                  Try searching for a different topic or check back soon for new stories.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 pt-6 text-sm">
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={page <= 1}
                  className="min-w-[96px]"
                >
                  <Link href={{ pathname: '/', query: { ...(q ? { q } : {}), page: page - 1 } }}>
                    Previous
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={page >= totalPages}
                  className="min-w-[96px]"
                >
                  <Link href={{ pathname: '/', query: { ...(q ? { q } : {}), page: page + 1 } }}>
                    Next
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>
        <aside className="space-y-6 lg:sticky lg:top-32">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Stay in the loop</CardTitle>
              <CardDescription>
                Get hand-picked stories delivered to your inbox each week. No noise, just signal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3">
                <Input type="email" placeholder="your@email.com" required autoComplete="email" />
                <Button type="submit" className="w-full">Subscribe</Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              We respect your privacy. Unsubscribe at any time.
            </CardFooter>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Browse topics</CardTitle>
              <CardDescription>Explore our favorite themes and ongoing series.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <Badge key={t.id} asChild variant="outline" className="px-3 py-1 text-sm">
                  <Link href={`/tag/${t.slug}`}>#{t.name}</Link>
                </Badge>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-muted-foreground">Tags are coming soon.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function toTitleCase(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}
