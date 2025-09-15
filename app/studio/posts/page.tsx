import { auth } from "@/auth-app";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { desc, eq, inArray } from "drizzle-orm";
import PostsTableClient, { type PostRow } from "@/components/PostsTableClient";
import { redirect } from "next/navigation";

export default async function StudioPosts({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  // const uid = (session?.user as any)?.id as string | undefined;
  if (role !== 'admin') return redirect('/studio/my-blogs');
  const params = (await searchParams) || {};
  const q = (params.q || "").toLowerCase();
  const mine = false;
  const draftOnly = params.draft === "1";
  const authorParam = params.author as string | undefined;
  const statusParam = (params.status as string | undefined) || 'all';
  const assigneeParam = params.assignee as string | undefined;
  const sort = params.sort === "visits" ? "visits" : "updated";
  const limit = Math.max(1, Math.min(Number(params.limit) || 15, 500));

  const base = db
    .select({ p: posts, u: users })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(undefined as any)
    .orderBy(desc(posts.updatedAt));

  let list = (await base).map((row: any) => ({ ...row.p, authorName: row.u?.name || row.u?.email || "Unknown", authorId: row.u?.id }));
  // Load users for assignee display
  const ids = Array.from(new Set(list.map((p:any)=>p.assignedTo).filter(Boolean)));
  const assignees = ids.length ? await db.select().from(users).where(inArray(users.id, ids as string[])) : [];
  const nameById = new Map(assignees.map((u:any)=>[u.id, u.name || u.email]));
  const imgById = new Map(assignees.map((u:any)=>[u.id, u.image || null]));

  if (draftOnly) list = list.filter((p) => String(p.status) === "draft");
  if (statusParam && statusParam !== 'all') list = list.filter((p)=> String(p.status) === statusParam);
  if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q));
  if (!mine && authorParam) list = list.filter((p: any) => p.authorId === authorParam);
  if (assigneeParam) list = list.filter((p:any)=> p.assignedTo === assigneeParam);

  // map to table rows with fallback visits
  let mapped: PostRow[] = list.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: String(p.status),
    visits: Number((p as any).views ?? 0),
    updatedAt: p.updatedAt as any,
    authorId: p.authorId,
    authorName: p.authorName,
    assignedToName: p.assignedTo ? (nameById.get(p.assignedTo) || p.assignedTo) : undefined,
  }));

  if (sort === "visits") mapped = mapped.sort((a, b) => b.visits - a.visits);
  const total = mapped.length;
  const rows = mapped.slice(0, limit);

  // Build author filter options for admins (all blogs view)
  const authorOptions = true
    ? Array.from(
        new Map(list.map((p: any) => [p.authorId, p.authorName])).entries()
      )
        .filter(([id]) => !!id)
        .map(([id, label]) => ({ id: id as string, label: String(label) }))
    : [];
  const assigneeOptions = Array.from(new Map(list.filter((p:any)=>p.assignedTo).map((p:any)=>[p.assignedTo, p.assignedToName || p.assignedTo])).entries()).map(([id, label])=>({ id: id as string, label: String(label) }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Posts</h1>
      </div>
      <PostsTableClient rows={rows} total={total} limit={limit} mine={false} draftOnly={draftOnly} sort={sort} authorOptions={authorOptions} author={authorParam ?? null} status={statusParam} assigneeOptions={assigneeOptions} assignee={assigneeParam ?? null} />
      {rows.length === 0 && <p className="text-sm text-gray-500">No posts found.</p>}
    </div>
  );
}
