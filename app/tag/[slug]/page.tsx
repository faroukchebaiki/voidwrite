import { db } from "@/db";
import { posts, tags, postTags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { summarizeExcerpt } from "@/lib/text";

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
  return (
    <main className="mx-auto reading-width px-4 py-8 sm:py-10">
      <h1 className="mb-6 font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
        Tag: {tag.name}
      </h1>
      <div className="space-y-4">
        {list.map((p) => {
          const excerptPreview = summarizeExcerpt(p.excerpt);
          return (
            <article key={p.id} className="rounded-xl border border-border/60 p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <h2 className="font-heading text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                <Link href={`/posts/${p.slug}`}>{p.title}</Link>
              </h2>
              {excerptPreview && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {excerptPreview}
                </p>
              )}
            </article>
          );
        })}
        {list.length === 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">No posts for this tag.</p>
        )}
      </div>
    </main>
  );
}
