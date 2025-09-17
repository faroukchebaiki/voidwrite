import { db } from "@/db";
import { posts, postNotes } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { auth } from "@/auth-app";
import { eq, desc } from "drizzle-orm";
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
  const rawNotes = await db
    .select({
      id: postNotes.id,
      note: postNotes.note,
      createdAt: postNotes.createdAt,
      authorId: postNotes.authorId,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(postNotes)
    .leftJoin(users, eq(users.id, postNotes.authorId))
    .where(eq(postNotes.postId, id))
    .orderBy(desc(postNotes.createdAt));

  const notes = rawNotes.map((n) => ({
    id: n.id,
    note: n.note,
    createdAt: n.createdAt?.toISOString?.() || (n.createdAt as any),
    authorId: n.authorId,
    authorName: n.authorName || n.authorEmail || "Unknown",
  }));

  return (
    <main>
      <PostEditor
        initial={{ ...post, assignedToName: assignee?.label }}
        role={role}
        uid={uid}
        notes={notes}
      />
    </main>
  );
}
