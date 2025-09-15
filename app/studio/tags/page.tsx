import { auth } from "@/auth-app";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import TagsClient from "./client";

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (role !== 'admin') redirect('/studio');
  const list = await db.select().from(tags).orderBy(desc(tags.name));
  return <TagsClient list={list as any} />;
}

