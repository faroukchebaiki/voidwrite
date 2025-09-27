import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { posts, profiles } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminControls from "@/components/AdminControls";
import { requireStaff } from "@/lib/auth-helpers";

export default async function MemberProfile({ params }: any) {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  if (role !== "admin") redirect("/studio");
  const { id } = await params;
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) redirect("/studio/members");
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, id));
  const authored = await db
    .select()
    .from(posts)
    .where(and(eq(posts.authorId, id), eq(posts.trashed as any, false as any)))
    .orderBy(desc(posts.updatedAt));
  const drafts = authored.filter((p: any) => String(p.status) === "draft");
  const published = authored.filter((p: any) => String(p.status) === "published");
  const username = (u.email || "").split("@")[0];
  const fallbackName = u.name || username;
  const [rawFirst, ...remaining] = (fallbackName || "").split(" ");
  const fallbackLast = remaining.join(" ");
  const formatSegment = (value: string | null | undefined) => {
    const segment = (value || "").trim();
    if (!segment) return "";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };
  const first = formatSegment(profile?.firstName || rawFirst || username);
  const last = formatSegment(profile?.lastName || fallbackLast);
  const displayName = [first, last].filter(Boolean).join(" ") || formatSegment(username) || "Member";
  const avatar = u.image || "https://github.com/shadcn.png";
  // Build transfer options (all other users)
  const everyone = await db.select().from(users);
  const options = everyone
    .filter((x: any) => x.id !== id)
    .map((u: any) => ({ id: u.id, label: u.name || u.email || u.id }));

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={displayName} className="h-20 w-20 rounded-full border object-cover" />
        <div>
          <div className="text-2xl font-semibold">{displayName}</div>
          <div className="text-sm text-muted-foreground">@{username} · {u.email}</div>
        </div>
      </div>
      <AdminControls
        targetId={id}
        targetRole={(profile?.role as string) || 'editor'}
        suspended={Boolean(profile?.suspended)}
        options={options}
      />
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
