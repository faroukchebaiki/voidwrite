import Link from "next/link";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function StudioPosts() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const uid = (session?.user as any)?.id as string | undefined;
  const rows = role === 'admin'
    ? await db.select().from(posts).orderBy(desc(posts.updatedAt))
    : await db.select().from(posts).where(eq(posts.authorId, uid as string)).orderBy(desc(posts.updatedAt));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{role === 'admin' ? 'All blogs' : 'My blogs'}</h1>
        <Link href="/studio/posts/new" className="border rounded px-3 py-2 text-sm">Write a blog</Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Title</th>
            <th>Status</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">
                <div className="font-medium">{p.title}</div>
                <div className="text-gray-500">/{p.slug}</div>
              </td>
              <td>{p.status}</td>
              <td>{new Date(p.updatedAt).toLocaleString()}</td>
              <td>
                <Link href={`/studio/posts/${p.id}`} className="underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-sm text-gray-500">No posts yet.</p>}
    </div>
  );
}
