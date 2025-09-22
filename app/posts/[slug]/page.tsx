import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { posts, profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { renderMarkdown } from "@/lib/markdown";
import ViewTracker from "@/components/ViewTracker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
  if (!post) return {};
  const description = post.excerpt || undefined;
  const keywords = (post as any).seoKeywords
    ? String((post as any).seoKeywords)
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined;
  return {
    title: post.title,
    description,
    keywords,
    openGraph: {
      title: post.title,
      description,
    },
  } as any;
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
  const authorDisplayName = authorNameParts.join(' ').trim() || (authorUser?.name?.trim() ?? 'Voidwrite Contributor');
  const authorBio = profile?.bio?.trim() || null;
  const authorImage = authorUser?.image?.trim() || null;
  const rawLink = profile?.link?.trim() || null;
  const authorLink = normalizeLink(rawLink);
  const authorHost = (() => {
    if (!authorLink) return null;
    try {
      return new URL(authorLink).hostname;
    } catch {
      return null;
    }
  })();
  const initials = authorDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('') || 'VW';

  return (
    <main className="mx-auto reading-width px-4 py-8 sm:py-12">
      <ViewTracker slug={slug} />
      {post.coverImageUrl && (
        <div className="mb-8 overflow-hidden rounded-xl border border-border/60">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            width={1200}
            height={630}
            className="h-auto w-full object-cover"
            priority={false}
          />
        </div>
      )}
      <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
        {post.title}
      </h1>
      {post.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
      )}
      <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
      <AuthorCard
        name={authorDisplayName}
        bio={authorBio}
        image={authorImage}
        initials={initials}
        link={authorLink}
        host={authorHost}
      />
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

function AuthorCard({
  name,
  bio,
  image,
  initials,
  link,
  host,
}: {
  name: string;
  bio: string | null;
  image: string | null;
  initials: string;
  link: string | null;
  host: string | null;
}) {
  const classes = 'group mt-12 block rounded-2xl border border-border/70 bg-card/80 p-6 transition-colors duration-200 hover:border-primary/50 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';
  const content = (
    <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
      <Avatar className="h-16 w-16 border border-border/60">
        {image ? <AvatarImage src={image} alt={name} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {name}
        </div>
        {bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {bio}
          </p>
        ) : null}
        {link ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
            Visit profile
            {host && <span className="text-muted-foreground">({host})</span>}
          </span>
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
