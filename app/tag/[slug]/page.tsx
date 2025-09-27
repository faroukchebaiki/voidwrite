import { db } from "@/db";
import { posts, tags, postTags, profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { summarizeExcerpt } from "@/lib/text";
import { Tag as TagIcon, ChevronRight, ArrowRight } from "lucide-react";
import StayInLoopCard from "@/components/articles/StayInLoopCard";
import BrowseTopicsCard from "@/components/articles/BrowseTopicsCard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { siteConfig } from "@/site";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  // Defer to runtime
  return [];
}

function toTitleCase(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();
}

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
  const title = tag ? `Tag: ${tag.name}` : `Tag: ${slug}`;
  return { title } as any;
}

export default async function TagPage({ params, searchParams }: { params: any; searchParams?: Promise<Record<string, string>> }) {
  const { slug } = await params;
  const query = (await searchParams) || {};
  const pageParam = Number(query.page ?? '1');
  const pageSize = 8;

  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
  if (!tag) notFound();
  const joins = await db
    .select({ post: posts })
    .from(postTags)
    .innerJoin(posts, eq(posts.id, postTags.postId))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.status, "published" as any)))
    .orderBy(sql`coalesce(${posts.publishedAt}, ${posts.createdAt}) desc`);
  const list = joins.map((j) => j.post);

  const authorIds = Array.from(new Set(list.map((p) => p.authorId).filter(Boolean))) as string[];
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

  const numberFormatter = new Intl.NumberFormat();
  const allTags = await db.select().from(tags).orderBy(sql`${tags.name}`);
  const remoteHosts = new Set(['public.blob.vercel-storage.com', 'p06e0neae38vv52o.public.blob.vercel-storage.com']);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(Math.max(1, pageParam || 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paged = list.slice(startIndex, startIndex + pageSize);

  const basePath = `/tag/${slug}`;
  const buildHref = (page: number) => {
    if (page <= 1) return basePath;
    return `${basePath}?page=${page}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <TagIcon className="size-4" aria-hidden />
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-base font-medium text-foreground">{tag.name}</span>
      </div>
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
                  <div className="flex flex-col bg-card">
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
                  Try exploring another tag or check back soon—new stories land regularly.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {list.length > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2 text-foreground">
                <Link
                  href={buildHref(1)}
                  className={`rounded-full border px-3 py-1 transition ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
                  aria-disabled={currentPage === 1}
                >
                  First
                </Link>
                <Link
                  href={buildHref(Math.max(1, currentPage - 1))}
                  className={`rounded-full border px-3 py-1 transition ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
                  aria-disabled={currentPage === 1}
                >
                  Previous
                </Link>
                <Link
                  href={buildHref(Math.min(totalPages, currentPage + 1))}
                  className={`rounded-full border px-3 py-1 transition ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
                  aria-disabled={currentPage === totalPages}
                >
                  Next
                </Link>
                <Link
                  href={buildHref(totalPages)}
                  className={`rounded-full border px-3 py-1 transition ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
                  aria-disabled={currentPage === totalPages}
                >
                  Last
                </Link>
              </div>
            </div>
          )}
        </section>
        <aside className="space-y-6">
          <StayInLoopCard />
          <BrowseTopicsCard tags={allTags} />
        </aside>
      </div>
    </main>
  );
}
