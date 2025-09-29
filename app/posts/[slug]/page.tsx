import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, profiles, tags, dailyPostViews } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq, sql, inArray, desc } from "drizzle-orm";
import { renderMarkdown } from "@/lib/markdown";
import ViewTracker from "@/components/ViewTracker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostShareBar } from "@/components/PostShareBar";
import StayInLoopCard from "@/components/articles/StayInLoopCard";
import BrowseTopicsCard from "@/components/articles/BrowseTopicsCard";
import TopPostsCard from "@/components/articles/TopPostsCard";
import { siteConfig } from "@/site";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
  if (!post || post.status !== ("published" as any)) {
    return {};
  }

  const description = post.excerpt?.trim() || undefined;
  const keywords = (post as any).seoKeywords
    ? String((post as any).seoKeywords)
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined;

  const baseUrl = siteConfig.url?.replace(/\/$/, "") || "";
  const canonical = baseUrl ? `${baseUrl}/posts/${post.slug}` : undefined;
  const normalizedDescription = description?.replace(/\s+/g, ' ').trim();

  const toAbsolute = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    if (/^https?:\/\//i.test(value)) return value;
    if (!baseUrl) return undefined;
    const normalised = value.startsWith("/") ? value : `/${value}`;
    return `${baseUrl}${normalised}`;
  };

  const defaultOgImage = toAbsolute(siteConfig.branding.ogImage) || undefined;
  const coverImageFromPost = toAbsolute(post.coverImageUrl?.trim());
  const dynamicOg = baseUrl
    ? (() => {
        const params = new URLSearchParams({ title: post.title });
        if (normalizedDescription) {
          const subtitle = normalizedDescription.length > 180
            ? `${normalizedDescription.slice(0, 179)}…`
            : normalizedDescription;
          params.set('subtitle', subtitle);
        }
        return `${baseUrl}/api/og?${params.toString()}`;
      })()
    : undefined;
  const coverImage = coverImageFromPost || dynamicOg || defaultOgImage;

  const twitterHandle = (() => {
    const handle = siteConfig.author.twitter;
    if (!handle) return undefined;
    if (handle.startsWith("@")) return handle;
    return `@${handle.replace(/^https?:\/\/(www\.)?twitter\.com\//, "").replace(/\/.*/, "")}`;
  })();

  return {
    title: post.title,
    description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "article",
      url: canonical,
      siteName: siteConfig.title,
      title: post.title,
      description,
      images: coverImage
        ? [
            {
              url: coverImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: coverImage ? [coverImage] : undefined,
      creator: twitterHandle,
      site: twitterHandle,
    },
  };
}

export default async function PostPage({ params }: any) {
  const { slug } = await params;
  const rows = await db
    .select({ post: posts, profile: profiles, user: users })
    .from(posts)
    .leftJoin(profiles, eq(profiles.userId, posts.authorId))
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.slug, slug));
  const row = rows[0];
  const post = row?.post;
  if (!post || post.status !== ("published" as any)) notFound();
  const html = renderMarkdown(post.content);

  const profile = row?.profile;
  const authorUser = row?.user;
  const authorNameParts = [profile?.firstName?.trim(), profile?.lastName?.trim()].filter(Boolean) as string[];
  const rawAuthorName = authorNameParts.length > 0
    ? authorNameParts.join(' ')
    : authorUser?.name?.trim() ?? siteConfig.copy.misc.contributorFallback;
  const authorDisplayName = toTitleCase(rawAuthorName) || siteConfig.copy.misc.contributorFallback;
  const authorBio = profile?.bio?.trim() || null;
  const authorImage = authorUser?.image?.trim() || null;
  const rawLink = profile?.link?.trim() || null;
  const authorLink = normalizeLink(rawLink);
  const initials = authorDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('') || 'VW';
  const coverImageUrl = post.coverImageUrl?.trim() || null;
  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto') ?? 'https';
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? process.env.VERCEL_URL?.replace(/\/$/, '');
  const baseUrl = host ? `${proto}://${host}` : envBase ? (envBase.startsWith('http') ? envBase : `https://${envBase}`) : 'https://voidwrite.com';
  const postUrl = `${baseUrl.replace(/\/$/, '')}/posts/${post.slug}`;
  const allTags = await db.select().from(tags).orderBy(sql`${tags.name}`);

  const weeklyDates: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    weeklyDates.push(day.toISOString().slice(0, 10));
  }

  const totalViews = sql<number>`sum(${dailyPostViews.count})`.as('total');
  const weeklyLeaderboard = await db
    .select({ postId: dailyPostViews.postId, total: totalViews })
    .from(dailyPostViews)
    .where(inArray(dailyPostViews.day, weeklyDates))
    .groupBy(dailyPostViews.postId)
    .orderBy(desc(totalViews))
    .limit(7);

  const leaderboardIds = weeklyLeaderboard.map((entry) => entry.postId);
  let relatedPosts: (typeof posts.$inferSelect)[] = [];
  if (leaderboardIds.length) {
    relatedPosts = await db.select().from(posts).where(inArray(posts.id, leaderboardIds));
  }
  if (relatedPosts.length < 7) {
    const fallback = await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'published' as any))
      .orderBy(desc(posts.publishedAt ?? posts.createdAt))
      .limit(7);
    const combined = [...relatedPosts, ...fallback];
    const deduped = new Map<number, (typeof posts.$inferSelect)>();
    combined.forEach((entry) => deduped.set(entry.id, entry));
    relatedPosts = Array.from(deduped.values()).slice(0, 7);
  }

  const postById = new Map(relatedPosts.map((item) => [item.id, item]));
  let mostViewedThisWeek = weeklyLeaderboard
    .map((entry) => {
      const candidate = postById.get(entry.postId);
      if (!candidate || candidate.status !== ('published' as any)) return null;
      return {
        slug: candidate.slug,
        title: candidate.title,
        excerpt: candidate.excerpt,
        coverImageUrl: candidate.coverImageUrl,
        publishedAt: candidate.publishedAt ?? candidate.createdAt ?? null,
        totalViews: Number(entry.total ?? 0),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (mostViewedThisWeek.length === 0) {
    mostViewedThisWeek = relatedPosts
      .filter((candidate) => candidate.status === ('published' as any))
      .slice(0, 7)
      .map((candidate) => ({
        slug: candidate.slug,
        title: candidate.title,
        excerpt: candidate.excerpt,
        coverImageUrl: candidate.coverImageUrl,
        publishedAt: candidate.publishedAt ?? candidate.createdAt ?? null,
        totalViews: Number(candidate.views ?? 0),
      }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 font-roboto sm:py-12">
      <ViewTracker slug={slug} />
      {coverImageUrl ? (
        <section className="relative mb-8 overflow-hidden rounded-xl border border-border/40 bg-background/65 supports-[backdrop-filter]:backdrop-blur-md dark:border-border/30 dark:bg-background/55">
          <Image
            src={coverImageUrl}
            alt={post.title}
            fill
            className="object-cover opacity-80"
            priority={false}
            sizes="(min-width: 1024px) 960px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/65 to-background/80 dark:from-background/70 dark:via-background/80 dark:to-background/90" />
          <div className="relative mx-auto flex max-w-4xl flex-col gap-3 px-6 py-10 text-left text-foreground sm:px-10 sm:py-12">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {post.title}
            </h1>
          </div>
        </section>
      ) : null}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <article className="rounded-xl border border-border/40 bg-card/90 px-4 py-8 shadow-sm sm:px-9 sm:py-11 dark:border-border/30 dark:bg-background/55 supports-[backdrop-filter]:backdrop-blur">
          {!coverImageUrl && (
            <>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
            </>
          )}
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(post.createdAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="prose dark:prose-invert mt-6" dangerouslySetInnerHTML={{ __html: html }} />
          <PostShareBar url={postUrl} title={post.title} className="mt-10" />
          <AuthorCard
            name={authorDisplayName}
            bio={authorBio}
            image={authorImage}
            initials={initials}
            link={authorLink}
          />
        </article>
        <aside className="space-y-6">
          <TopPostsCard posts={mostViewedThisWeek} />
          <StayInLoopCard />
          <BrowseTopicsCard tags={allTags} />
        </aside>
      </div>
    </main>
  );
}

function normalizeLink(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function toTitleCase(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

function AuthorCard({
  name,
  bio,
  image,
  initials,
  link,
}: {
  name: string;
  bio: string | null;
  image: string | null;
  initials: string;
  link: string | null;
}) {
  const classes = 'group mt-12 block rounded-2xl border border-border/70 bg-card/80 p-6 font-roboto transition-colors duration-200 hover:border-primary/50 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';
  const content = (
    <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
      <Avatar className="h-16 w-16 border border-border/60">
        {image ? <AvatarImage src={image} alt={name} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="text-lg font-semibold tracking-tight text-foreground">
          {name}
        </div>
        {bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {bio}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} target="_blank" rel="noreferrer" className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
