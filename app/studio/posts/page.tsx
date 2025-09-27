import { db } from "@/db";
import { posts } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import PostsTableClient, { type PostRow } from "@/components/PostsTableClient";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth-helpers";

export default async function StudioPosts({ searchParams }: any) {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  if (role !== 'admin') return redirect('/studio/my-blogs');
  const params = (await searchParams) || {};
  const q = String((params as any).q || "").trim();
  const mine = false;
  const draftOnly = String((params as any).draft || "") === "1";
  const authorParam = (params as any).author ? String((params as any).author) : undefined;
  const statusParam = (params as any).status ? String((params as any).status) : 'all';
  const assigneeParam = (params as any).assignee ? String((params as any).assignee) : undefined;
  const sort = String((params as any).sort || "updated") === "visits" ? "visits" : "updated";
  const limit = Math.max(1, Math.min(Number((params as any).limit) || 15, 500));
  const offset = Math.max(0, Number((params as any).offset) || 0);

  // Build SQL filters for admin
  const wheres = [] as any[];
  wheres.push(eq(posts.trashed as any, false as any));
  if (draftOnly) wheres.push(eq(posts.status as any, 'draft' as any));
  if (statusParam && statusParam !== 'all') wheres.push(eq(posts.status as any, statusParam as any));
  if (!mine && authorParam) wheres.push(eq(posts.authorId, authorParam));
  if (assigneeParam) wheres.push(eq(posts.assignedTo as any, assigneeParam));
  if (q) {
    const like = `%${q}%`;
    wheres.push(or(ilike(posts.title, like), ilike(posts.excerpt, like)) as any);
  }

  // Total count
  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(posts)
    .where(wheres.length ? and(...wheres) : undefined as any);

  // Fetch page rows with join for author/assignee names
  const rows = await db
    .select({ p: posts, u: users })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(wheres.length ? and(...wheres) : undefined as any)
    .orderBy(sort === 'visits' ? desc(posts.views as any) : desc(posts.updatedAt))
    .limit(limit)
    .offset(offset);

  const list = rows.map((row: any) => ({ ...row.p, authorName: row.u?.name || row.u?.email || "Unknown", authorId: row.u?.id }));

  // Distinct assignees across filtered set (ignore assigneeParam for options)
  const wheresNoAssignee = wheres.filter((w) => String(w.sql ?? '').indexOf('assigned_to') === -1);
  const distinctAssignees = await db
    .select({ id: posts.assignedTo })
    .from(posts)
    .where(wheresNoAssignee.length ? and(...wheresNoAssignee) : undefined as any)
    .groupBy(posts.assignedTo);
  const ids = Array.from(new Set(distinctAssignees.map((r: any) => r.id).filter(Boolean)));
  const assignees = ids.length ? await db.select().from(users).where(inArray(users.id, ids as string[])) : [];
  const nameById = new Map(assignees.map((u:any)=>[u.id, u.name || u.email]));

  // map to table rows with fallback visits
  const mapped: PostRow[] = list.map((p: any) => ({
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

  const total = Number(cnt);

  // Build author filter options across the full filtered set (ignore authorParam to show all)
  const wheresNoAuthor = wheres.filter((w) => String((w as any).sql ?? '').indexOf('author_id') === -1);
  const distinctAuthors = await db
    .select({ id: posts.authorId })
    .from(posts)
    .where(wheresNoAuthor.length ? and(...wheresNoAuthor) : undefined as any)
    .groupBy(posts.authorId);
  const authorIds = Array.from(new Set(distinctAuthors.map((r: any) => r.id).filter(Boolean)));
  const authors = authorIds.length ? await db.select().from(users).where(inArray(users.id, authorIds as string[])) : [];
  const authorOptions = authors.map((u: any) => ({ id: u.id, label: u.name || u.email }));

  // Build assignee filter options across full filtered set (ignore assigneeParam)
  const assigneeOptions = ids.map((id: string) => ({ id, label: nameById.get(id) || id }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Posts</h1>
      </div>
      <PostsTableClient rows={mapped} total={total} limit={limit} mine={false} draftOnly={draftOnly} sort={sort} authorOptions={authorOptions} author={authorParam ?? null} status={statusParam} assigneeOptions={assigneeOptions} assignee={assigneeParam ?? null} query={q} />
      {rows.length === 0 && <p className="text-sm text-gray-500">No posts found.</p>}
    </div>
  );
}
