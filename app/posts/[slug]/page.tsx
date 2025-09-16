import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdown } from "@/lib/markdown";
import ViewTracker from "@/components/ViewTracker";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
  if (!post) return {};
  const description = post.excerpt || undefined;
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
    },
  } as any;
}

export default async function PostPage({ params }: any) {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
  if (!post || post.status !== ("published" as any)) notFound();
  const html = renderMarkdown(post.content);
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <ViewTracker slug={slug} />
      {post.coverImageUrl && (
        <div className="mb-4">
          <Image src={post.coverImageUrl} alt={post.title} width={1200} height={630} className="w-full h-auto rounded" />
        </div>
      )}
      <h1 className="text-3xl font-semibold mb-2">{post.title}</h1>
      {post.excerpt && <p className="text-gray-500 mb-4">{post.excerpt}</p>}
      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
