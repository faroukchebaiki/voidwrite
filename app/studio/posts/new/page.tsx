import PostEditor from "@/components/PostEditor";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireStaff } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function NewPostPage() {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  const uid = (user as any)?.id as string | undefined;
  const availableTags = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(tags)
    .orderBy(sql`${tags.name} asc`);
  return (
    <PostEditor
      mode="create"
      role={role}
      uid={uid}
      tags={availableTags.map((t) => ({ slug: t.slug, name: t.name || t.slug }))}
      comments={[]}
      initial={{ status: 'draft', assignedTo: null, assignedToName: null, coverImageUrl: null, adminNote: null, trashed: false }}
      initialTags={[]}
    />
  );
}
