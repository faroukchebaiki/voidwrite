import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Editor from "./Editor";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) notFound();
  return (
    <main>
      <Editor initial={post as any} />
    </main>
  );
}
