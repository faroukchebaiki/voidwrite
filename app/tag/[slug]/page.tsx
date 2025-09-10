import { db } from "@/db";
import { posts, tags, postTags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  // Defer to runtime
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
  const title = tag ? `Tag: ${tag.name}` : `Tag: ${slug}`;
  return { title } as any;
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
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
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Tag: {tag.name}</h1>
      <div className="space-y-3">
        {list.map((p) => (
          <article key={p.id} className="border rounded-md p-4">
            <h2 className="text-lg font-medium">
              <Link href={`/posts/${p.slug}`}>{p.title}</Link>
            </h2>
            {p.excerpt && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{p.excerpt}</p>}
          </article>
        ))}
        {list.length === 0 && <p className="text-sm text-gray-500">No posts for this tag.</p>}
      </div>
    </main>
  );
}
