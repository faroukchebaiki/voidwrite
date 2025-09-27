import { db } from "@/db";
import { posts } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq, desc, and } from "drizzle-orm";
import PendingClient from "./client";
import { requireStaff } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  if (role !== 'admin') return null;
  const rows = await db
    .select({ p: posts, a: users })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.status as any, 'submitted' as any), eq(posts.trashed as any, false as any)))
    .orderBy(desc(posts.submittedAt));
  const list = rows.map((r:any)=>({
    id: r.p.id,
    title: r.p.title,
    slug: r.p.slug,
    author: r.a?.name || r.a?.email || 'Unknown',
    submittedAt: r.p.submittedAt as string,
    adminNote: r.p.adminNote as string | null,
    assignedTo: r.p.assignedTo as string | null,
  }));
  return <PendingClient items={list} />;
}
