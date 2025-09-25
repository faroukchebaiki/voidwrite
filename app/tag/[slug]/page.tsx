import { db } from "@/db";
import { posts, tags, postTags } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { summarizeExcerpt } from "@/lib/text";
import { Tag as TagIcon, ChevronRight } from "lucide-react";
import StayInLoopCard from "@/components/articles/StayInLoopCard";
import BrowseTopicsCard from "@/components/articles/BrowseTopicsCard";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  // Defer to runtime
  return [];
}

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
  const title = tag ? `Tag: ${tag.name}` : `Tag: ${slug}`;
  return { title } as any;
}

export default async function TagPage({ params }: any) {
  const { slug } = await params;
  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
  if (!tag) notFound();
  const joins = await db
    .select({ p: posts })
    .from(postTags)
    .innerJoin(posts, eq(posts.id, postTags.postId))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.status, "published" as any)));
  const list = joins.map((j) => j.p);
  const allTags = await db.select().from(tags).orderBy(sql`${tags.name}`);
  const remoteHosts = new Set(['public.blob.vercel-storage.com', 'p06e0neae38vv52o.public.blob.vercel-storage.com']);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <TagIcon className="size-4" aria-hidden />
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-base font-medium text-foreground">{tag.name}</span>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section className="space-y-6">
          {list.map((p) => {
            const excerptPreview = summarizeExcerpt(p.excerpt);
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
            return (
              <Link
                key={p.id}
                href={`/posts/${p.slug}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
              >
                <article className="font-roboto overflow-hidden rounded-xl border border-border/60 p-0 shadow-none transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div className="relative h-48 w-full overflow-hidden sm:h-56 lg:h-60">
                    <Image
                      src={imageSrc}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1280px) 640px, (min-width: 1024px) 520px, (min-width: 640px) 60vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-5 px-6 py-6">
                    <h2 className="text-2xl font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary sm:text-3xl">
                      {p.title}
                    </h2>
                    {excerptPreview ? (
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {excerptPreview}
                      </p>
                    ) : null}
                  </div>
                </article>
              </Link>
            );
          })}
          {list.length === 0 && (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-8 text-center">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">No posts found</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Try exploring another tag or check back soon—new stories land regularly.
                </p>
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
