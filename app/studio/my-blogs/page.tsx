import PostsTableClient, { type PostRow } from "@/components/PostsTableClient";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

export default async function MyBlogsPage({ searchParams }: any) {
  const session = await auth();
  const uid = (session?.user as any)?.id as string | undefined;
  const params = (await searchParams) || {};
  const q = String((params as any).q || "").trim();
  const draftOnly = String((params as any).draft || "") === "1";
  const sort = String((params as any).sort || "updated") === "visits" ? "visits" : "updated";
  const statusParam = (params as any).status ? String((params as any).status) : 'all';
  const assigneeParam = (params as any).assignee ? String((params as any).assignee) : undefined;
  const limit = Math.max(1, Math.min(Number((params as any).limit) || 15, 500));
  const offset = Math.max(0, Number((params as any).offset) || 0);

  // Build SQL filters
  const userFilter = or(eq(posts.authorId, String(uid)), eq(posts.assignedTo as any, String(uid)));
  const wheres = [userFilter] as any[];
  if (draftOnly) wheres.push(eq(posts.status as any, 'draft' as any));
  if (statusParam && statusParam !== 'all') wheres.push(eq(posts.status as any, statusParam as any));
  let assigneeFilter: any = null;
  if (assigneeParam) {
    assigneeFilter = eq(posts.assignedTo as any, assigneeParam);
    wheres.push(assigneeFilter);
  }
  if (q) {
    const like = `%${q}%`;
    wheres.push(or(ilike(posts.title, like), ilike(posts.excerpt, like)) as any);
  }

  // Total count for pagination
  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(posts)
    .where(and(...wheres));

  // Fetch page rows with join for author name
  const rows = await db
    .select({ p: posts, u: users })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(...wheres))
    .orderBy(sort === 'visits' ? desc(posts.views as any) : desc(posts.updatedAt))
    .limit(limit)
    .offset(offset);

  const list = rows.map((row: any) => ({ ...row.p, authorName: row.u?.name || row.u?.email || "Unknown", authorId: row.u?.id }));

  // Distinct assignees across full filtered set (ignoring assigneeParam)
  const wheresNoAssignee = assigneeFilter ? wheres.filter((w) => w !== assigneeFilter) : [...wheres];
  const distinctAssignees = await db
    .select({ id: posts.assignedTo })
    .from(posts)
    .where(and(...wheresNoAssignee))
    .groupBy(posts.assignedTo);
  const assigneeIds = Array.from(new Set(distinctAssignees.map((r: any) => r.id).filter(Boolean)));
  const assignees = assigneeIds.length ? await db.select().from(users).where(inArray(users.id, assigneeIds as string[])) : [];
  const assigneeName = new Map(assignees.map((u:any)=>[u.id, u.name || u.email]));

  const mapped: PostRow[] = list.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: String(p.status),
    visits: Number((p as any).views ?? 0),
    updatedAt: p.updatedAt as any,
    authorId: p.authorId,
    authorName: p.authorName,
    assignedToName: p.assignedTo ? (assigneeName.get(p.assignedTo) || p.assignedTo) : undefined,
  }));

  const total = Number(cnt);
  const assigneeOptions = assigneeIds.map((id: string) => ({ id, label: assigneeName.get(id) || id }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Posts</h1>
      </div>
      <PostsTableClient rows={mapped} total={total} limit={limit} mine={true} draftOnly={draftOnly} sort={sort} status={statusParam} assigneeOptions={assigneeOptions} assignee={assigneeParam ?? null} />
      {rows.length === 0 && <p className="text-sm text-gray-500">No posts found.</p>}
    </div>
  );
}
