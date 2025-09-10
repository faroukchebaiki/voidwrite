import { notFound } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
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

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
  if (!post || post.status !== ("published" as any)) notFound();
  const html = renderMarkdown(post.content);
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-semibold mb-2">{post.title}</h1>
      {post.excerpt && <p className="text-gray-500 mb-4">{post.excerpt}</p>}
      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
