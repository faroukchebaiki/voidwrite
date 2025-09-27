import { db } from "@/db";
import { invites } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { inArray, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import InviteClient from "./client";
import { requireStaff } from "@/lib/auth-helpers";

export default async function InvitePage() {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  if (role !== 'admin') redirect('/studio');
  const rows = await db.select().from(invites).orderBy(desc(invites.createdAt));
  const ids = Array.from(new Set(rows.flatMap((r:any)=>[r.createdBy, r.usedBy].filter(Boolean))));
  const usersList = ids.length ? await db.select().from(users).where(inArray(users.id, ids as string[])) : [];
  const byId = new Map(usersList.map((u:any)=>[u.id, u]));
  const list = rows.map((r:any)=>({
    code: r.code,
    createdAt: r.createdAt,
    createdBy: byId.get(r.createdBy as string)?.email || r.createdBy,
    usedAt: r.usedAt,
    usedBy: r.usedBy ? (byId.get(r.usedBy as string)?.email || r.usedBy) : null,
  }));
  return <InviteClient list={list} />;
}
