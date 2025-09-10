import Link from "next/link";
import { db } from "@/db";
import { posts, tags, settings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const [site] = await db.select().from(settings).limit(1);
  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published" as any))
    .orderBy(desc(posts.publishedAt ?? posts.createdAt));
  const allTags = await db.select().from(tags).orderBy(sql`${tags.name}`);
  const paramsObj = (await searchParams) || {};
  const q = (paramsObj.q || "").toLowerCase();
  const filtered = q
    ? allPosts.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q)
      )
    : allPosts;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{site?.siteTitle ?? "My Blog"}</h1>
        {site?.siteDescription && (
          <p className="text-gray-500 dark:text-gray-400">{site.siteDescription}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-3">
          {filtered.map((p) => (
            <article key={p.id} className="border rounded-md p-4">
              <h2 className="text-xl font-medium">
                <Link href={`/posts/${p.slug}`}>{p.title}</Link>
              </h2>
              {p.excerpt && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{p.excerpt}</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "Draft"}
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500">No posts found.</p>
          )}
        </div>
        <aside>
          <h3 className="font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <Link key={t.id} href={`/tag/${t.slug}`} className="px-2 py-1 text-xs border rounded-md">
                {t.name}
              </Link>
            ))}
            {allTags.length === 0 && <span className="text-sm text-gray-500">No tags</span>}
          </div>
        </aside>
      </div>
    </main>
  );
}
