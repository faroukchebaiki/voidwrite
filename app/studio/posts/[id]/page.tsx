import { db } from "@/db";
import { posts, postNotes, postTags, tags } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { auth } from "@/auth-app";
import { eq, desc, sql } from "drizzle-orm";
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
  const isTrashed = Boolean((post as any).trashed);
  if (!uid) notFound();
  const isAdmin = role === 'admin';
  const isAuthor = post.authorId === uid;
  const isAssignee = post.assignedTo === uid;
  if (!isAdmin && !isAuthor && !isAssignee) notFound();
  if (isTrashed && !isAdmin) notFound();
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
      authorImage: users.image,
    })
    .from(postNotes)
    .leftJoin(users, eq(users.id, postNotes.authorId))
    .where(eq(postNotes.postId, id))
    .orderBy(desc(postNotes.createdAt));

  const comments = rawNotes.map((n) => ({
    id: n.id,
    note: n.note,
    createdAt: n.createdAt?.toISOString?.() || (n.createdAt as any),
    authorId: n.authorId,
    authorName: n.authorName || n.authorEmail || "Unknown",
    authorImage: n.authorImage || null,
  }));

  const tagRows = await db
    .select({ slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, id));
  const initialTags = tagRows.map((t) => t.slug);
  const availableTags = await db
    .select({ slug: tags.slug, name: tags.name })
    .from(tags)
    .orderBy(sql`${tags.name} asc`);

  return (
    <main>
      <PostEditor
        mode="edit"
        tags={availableTags.map((t) => ({ slug: t.slug, name: t.name || t.slug }))}
        initial={{ ...post, assignedToName: assignee?.label }}
        role={role}
        uid={uid}
        comments={comments}
        initialTags={initialTags}
      />
    </main>
  );
}
