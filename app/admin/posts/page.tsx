import Link from "next/link";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminPosts() {
  const all = await db.select().from(posts).orderBy(desc(posts.updatedAt));
  return (
    <main className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link href="/admin/posts/new" className="border rounded px-3 py-2 text-sm">New Post</Link>
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
          {all.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">
                <div className="font-medium">{p.title}</div>
                <div className="text-gray-500">/{p.slug}</div>
              </td>
              <td>{p.status}</td>
              <td>{new Date(p.updatedAt).toLocaleString()}</td>
              <td>
                <Link href={`/admin/posts/${p.id}`} className="underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {all.length === 0 && <p className="text-sm text-gray-500">No posts yet.</p>}
    </main>
  );
}
export const dynamic = 'force-dynamic';
