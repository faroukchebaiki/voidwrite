import { db } from "@/db";
import { posts } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { auth } from "@/auth-app";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PostEditor from "@/components/PostEditor";

export default async function EditPostPage({ params }: any) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) notFound();
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const uid = (session?.user as any)?.id as string | undefined;
  let assignee: { id: string; label: string; image?: string | null } | null = null;
  if ((post as any).assignedTo) {
    const [u] = await db.select().from(users).where(eq(users.id, (post as any).assignedTo as any));
    if (u) assignee = { id: u.id, label: u.name || u.email || 'User', image: u.image };
  }
  return (
    <main>
      <PostEditor initial={{ ...post, assignedToName: assignee?.label }} role={role} uid={uid} />
    </main>
  );
}
