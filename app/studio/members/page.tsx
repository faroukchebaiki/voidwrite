import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { profiles, posts } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { requireStaff } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  publishedCount: number;
};

export default async function MembersPage() {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;

  const raw = await db
    .select({ u: users, p: profiles })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id));

  const counts = await db
    .select({ authorId: posts.authorId, cnt: sql<number>`count(*)` })
    .from(posts)
    .where(and(eq(posts.status as any, "published" as any), eq(posts.trashed as any, false as any)))
    .groupBy(posts.authorId);
  const countMap = new Map<string, number>(counts.map((r: any) => [r.authorId as string, Number(r.cnt)]));

  const members: Member[] = raw.map((row: any) => ({
    id: row.u.id,
    name: row.u.name,
    email: row.u.email,
    image: row.u.image,
    role: row.p?.role ?? "editor",
    publishedCount: countMap.get(row.u.id) ?? 0,
  }));

  const admins = members.filter((m) => m.role === "admin");
  const authors = members.filter((m) => m.role !== "admin");

  const Item = ({ m }: { m: Member }) => {
    const name = m.name || (m.email ? m.email.split("@")[0] : "User");
    const [first, ...rest] = name.split(" ");
    const last = rest.join(" ");
    const avatar = m.image || "https://github.com/shadcn.png";
    return (
      <Link href={`/studio/members/${m.id}`} className="flex items-center justify-between rounded border p-3 hover:bg-muted/40">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={name} className="h-10 w-10 rounded-full border object-cover" />
          <div>
            <div className="font-medium">{first} {last}</div>
            <div className="text-xs text-muted-foreground">{m.email}</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{m.publishedCount} posts</div>
      </Link>
    );
  };

  if (role !== 'admin') {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">Team</h1>
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Admins</h2>
          <div className="space-y-2">
            {admins.length === 0 && <div className="text-sm text-muted-foreground">No admins.</div>}
            {admins.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded border p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.image || "https://github.com/shadcn.png"} alt={m.name || ''} className="h-10 w-10 rounded-full border object-cover" />
                  <div>
                    <div className="font-medium">{m.name || (m.email ? m.email.split('@')[0] : 'Admin')}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{m.publishedCount} posts</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Team</h1>
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Admins</h2>
        <div className="space-y-2">
          {admins.length === 0 && <div className="text-sm text-muted-foreground">No admins.</div>}
          {admins.map((m) => <Item key={m.id} m={m} />)}
        </div>
      </section>
      <hr className="border-t" />
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Authors</h2>
        <div className="space-y-2">
          {authors.length === 0 && <div className="text-sm text-muted-foreground">No authors yet.</div>}
          {authors.map((m) => <Item key={m.id} m={m} />)}
        </div>
      </section>
    </main>
  );
}
