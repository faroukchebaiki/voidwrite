import { db } from "@/db";
import { tags } from "@/db/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import TagsClient from "./client";
import { requireStaff } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  if (role !== 'admin') redirect('/studio');
  const list = await db.select().from(tags).orderBy(desc(tags.name));
  return <TagsClient list={list as any} />;
}
