import PostsTableClient, { type PostRow } from "@/components/PostsTableClient";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { desc, eq } from "drizzle-orm";

export default async function MyBlogsPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const session = await auth();
  const uid = (session?.user as any)?.id as string | undefined;
  const params = (await searchParams) || {};
  const q = (params.q || "").toLowerCase();
  const draftOnly = params.draft === "1";
  const sort = params.sort === "visits" ? "visits" : "updated";
  const limit = Math.max(1, Math.min(Number(params.limit) || 15, 500));

  const base = db
    .select({ p: posts, u: users })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.authorId, uid as string))
    .orderBy(desc(posts.updatedAt));

  let list = (await base).map((row: any) => ({ ...row.p, authorName: row.u?.name || row.u?.email || "Unknown", authorId: row.u?.id }));

  if (draftOnly) list = list.filter((p) => String(p.status) === "draft");
  if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q));

  let mapped: PostRow[] = list.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: String(p.status),
    visits: Number(p.views ?? 0),
    updatedAt: p.updatedAt as any,
    authorId: p.authorId,
    authorName: p.authorName,
  }));

  if (sort === "visits") mapped = mapped.sort((a, b) => b.visits - a.visits);
  const total = mapped.length;
  const rows = mapped.slice(0, limit);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My blogs</h1>
      </div>
      <PostsTableClient rows={rows} total={total} limit={limit} mine={true} draftOnly={draftOnly} sort={sort} />
      {rows.length === 0 && <p className="text-sm text-gray-500">No posts found.</p>}
    </div>
  );
}

