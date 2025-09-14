import { auth } from "@/auth-app";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MemberProfile({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (role !== "admin") redirect("/studio");
  const { id } = await params;
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) redirect("/studio/members");
  const authored = await db.select().from(posts).where(eq(posts.authorId, id)).orderBy(desc(posts.updatedAt));
  const drafts = authored.filter((p: any) => String(p.status) === "draft");
  const published = authored.filter((p: any) => String(p.status) === "published");
  const name = u.name || (u.email ? u.email.split("@")[0] : "User");
  const [first, ...rest] = name.split(" ");
  const last = rest.join(" ");
  const username = (u.email || "").split("@")[0];
  const avatar = u.image || "https://github.com/shadcn.png";
  return (
    <main className="space-y-6">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={name} className="h-20 w-20 rounded-full border object-cover" />
        <div>
          <div className="text-2xl font-semibold">{first} {last}</div>
          <div className="text-sm text-muted-foreground">@{username} · {u.email}</div>
        </div>
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Drafts</h2>
        <div className="space-y-2">
          {drafts.length === 0 && <div className="text-sm text-muted-foreground">No drafts.</div>}
          {drafts.map((p: any) => (
            <Link key={p.id} href={`/studio/posts/${p.id}`} className="block rounded border p-3 hover:bg-muted/40">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground">/{p.slug}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Published</h2>
        <div className="space-y-2">
          {published.length === 0 && <div className="text-sm text-muted-foreground">No published posts.</div>}
          {published.map((p: any) => (
            <Link key={p.id} href={`/studio/posts/${p.id}`} className="block rounded border p-3 hover:bg-muted/40">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground">/{p.slug}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

