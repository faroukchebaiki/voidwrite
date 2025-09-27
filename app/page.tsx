import Link from "next/link";
import { db } from "@/db";
import { posts, tags, profiles, dailyPostViews } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeFeed, type HomeFeedPost } from "@/components/HomeFeed";
import StayInLoopCard from "@/components/articles/StayInLoopCard";
import TopPostsCard from "@/components/articles/TopPostsCard";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published" as any))
    .orderBy(desc(posts.publishedAt ?? posts.createdAt));
  const allTags = await db.select().from(tags).orderBy(sql`${tags.name}`);
  const authorIds = Array.from(new Set(allPosts.map((p) => p.authorId).filter(Boolean))) as string[];
  let authorProfiles: { userId: string; firstName: string | null; lastName: string | null }[] = [];
  let authorUsers: { id: string; name: string | null; email: string | null }[] = [];
  if (authorIds.length) {
    authorProfiles = await db
      .select({ userId: profiles.userId, firstName: profiles.firstName, lastName: profiles.lastName })
      .from(profiles)
      .where(inArray(profiles.userId, authorIds));
    authorUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, authorIds));
  }
  const authorNameMap = new Map<string, string>();
  for (const profile of authorProfiles) {
    const formatted = toTitleCase([profile.firstName, profile.lastName].filter(Boolean).join(' '));
    if (formatted) authorNameMap.set(profile.userId, formatted);
  }
  for (const user of authorUsers) {
    if (authorNameMap.has(user.id)) continue;
    const formatted = toTitleCase(user.name || '') || user.email || '';
    if (formatted) authorNameMap.set(user.id, formatted);
  }
  const paramsObj = (await searchParams) || {};
  const qParam = paramsObj.q || '';
  const pageParam = paramsObj.page;
  const initialPage = Math.max(1, Number(pageParam) || 1);

  const serializedPosts: HomeFeedPost[] = allPosts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    views: Number(post.views ?? 0),
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt ? post.createdAt.toISOString() : null,
    authorId: post.authorId,
  }));
  const authorEntriesSerialized = Array.from(authorNameMap.entries());

  const weeklyDays: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    weeklyDays.push(day.toISOString().slice(0, 10));
  }

  const totalViews = sql<number>`sum(${dailyPostViews.count})`.as('total');
  const weeklyLeaderboard = await db
    .select({ postId: dailyPostViews.postId, total: totalViews })
    .from(dailyPostViews)
    .where(inArray(dailyPostViews.day, weeklyDays))
    .groupBy(dailyPostViews.postId)
    .orderBy(desc(totalViews))
    .limit(7);

  const postsById = new Map(allPosts.map((post) => [post.id, post]));
  let mostViewedThisWeek = weeklyLeaderboard
    .map((entry) => {
      const post = postsById.get(entry.postId);
      if (!post) return null;
      const publishedAt = post.publishedAt ?? post.createdAt ?? null;
      return {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        publishedAt,
        totalViews: Number(entry.total ?? 0),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (mostViewedThisWeek.length === 0) {
    mostViewedThisWeek = allPosts.slice(0, 7).map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      publishedAt: post.publishedAt ?? post.createdAt ?? null,
      totalViews: Number(post.views ?? 0),
    }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section className="space-y-6">
          <HomeFeed
            posts={serializedPosts}
            authorEntries={authorEntriesSerialized}
            initialQuery={qParam}
            initialPage={initialPage}
          />
        </section>
        <aside className="space-y-6 lg:sticky lg:top-32">
          <TopPostsCard posts={mostViewedThisWeek} />

          <StayInLoopCard />

          <Card className="border-border/70">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Browse topics</CardTitle>
              <CardDescription>Explore our favorite themes and ongoing series.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <Badge key={t.id} asChild variant="outline" className="px-3 py-1 text-sm">
                  <Link href={`/tag/${t.slug}`}>#{t.name}</Link>
                </Badge>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-muted-foreground">Tags are coming soon.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function toTitleCase(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}
