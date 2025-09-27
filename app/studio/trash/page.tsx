import { redirect } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import TrashTableClient, { type TrashRow } from "@/components/TrashTableClient";
import { requireStaff } from "@/lib/auth-helpers";

export default async function TrashPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  if (role !== "admin") {
    return redirect("/studio/my-blogs");
  }

  const params = (await searchParams) ?? {};
  const qValue = params.q;
  const q = Array.isArray(qValue) ? qValue[0] : qValue || "";
  const limitParam = params.limit;
  const offsetParam = params.offset;
  const limit = Math.max(1, Math.min(Number(Array.isArray(limitParam) ? limitParam[0] : limitParam) || 15, 50));
  const offset = Math.max(0, Number(Array.isArray(offsetParam) ? offsetParam[0] : offsetParam) || 0);

  const filters: any[] = [eq(posts.trashed as any, true as any)];
  if (q.trim()) {
    const like = `%${q.trim()}%`;
    filters.push(
      or(
        ilike(posts.title, like),
        ilike(posts.slug, like),
        ilike(posts.excerpt, like)
      ) as any
    );
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(posts)
    .where(whereClause);

  const rows = await db
    .select({ p: posts, u: users })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(whereClause)
    .orderBy(desc(posts.trashedAt as any))
    .limit(limit)
    .offset(offset);

  const list: TrashRow[] = rows.map(({ p, u }: any) => ({
    id: p.id,
    title: p.title || "Untitled",
    slug: p.slug || "",
    status: String(p.status || "draft"),
    trashedAt: p.trashedAt ? new Date(p.trashedAt).toISOString() : null,
    authorName: u?.name || u?.email || null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trash</h1>
      </div>
      <TrashTableClient rows={list} total={Number(cnt)} limit={limit} offset={offset} search={q} />
    </div>
  );
}
