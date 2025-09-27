"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { summarizeExcerpt } from "@/lib/text";
import { siteConfig } from "@/site";

const REMOTE_HOSTS = new Set([
  'public.blob.vercel-storage.com',
  'p06e0neae38vv52o.public.blob.vercel-storage.com',
]);

export type HomeFeedPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  views: number;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  authorId: string | null;
};

type HomeFeedProps = {
  posts: HomeFeedPost[];
  authorEntries: [string, string][];
  initialQuery?: string;
  initialPage?: number;
};

export function HomeFeed({ posts, authorEntries, initialQuery = '', initialPage = 1 }: HomeFeedProps) {
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [feedPosts, setFeedPosts] = useState<HomeFeedPost[]>(posts);
  const [feedAuthors, setFeedAuthors] = useState<[string, string][]>(authorEntries);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ query: string; posts: HomeFeedPost[]; authors: [string, string][] }>).detail;
      if (!detail) return;
      setFeedPosts(detail.posts ?? []);
      setFeedAuthors(detail.authors ?? []);
      setPage(1);
    };
    window.addEventListener('voidwrite:home-search', handler as EventListener);
    return () => window.removeEventListener('voidwrite:home-search', handler as EventListener);
  }, []);

  useEffect(() => {
    setFeedPosts(posts);
    setFeedAuthors(authorEntries);
    setPage(Math.max(1, initialPage));
  }, [posts, authorEntries, initialQuery, initialPage]);

  const authorMap = useMemo(() => new Map(feedAuthors), [feedAuthors]);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(feedPosts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paged = feedPosts.slice(start, end);

  const resolveAuthor = (authorId: string | null) => {
    if (!authorId) return siteConfig.title;
    return authorMap.get(authorId) || siteConfig.title;
  };

  return (
    <div className="space-y-6">
      {paged.map((post) => {
        const publishedDate = post.publishedAt ? new Date(post.publishedAt) : post.createdAt ? new Date(post.createdAt) : null;
        const dateLabel = publishedDate?.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) ?? 'Coming soon';
        const cover = (() => {
          if (post.coverImageUrl) {
            if (post.coverImageUrl.startsWith('/')) return post.coverImageUrl;
            try {
              const url = new URL(post.coverImageUrl);
              if (REMOTE_HOSTS.has(url.hostname)) return post.coverImageUrl;
            } catch {
              return '/image.png';
            }
          }
          return '/image.png';
        })();
        const excerptPreview = summarizeExcerpt(post.excerpt);
        const authorName = resolveAuthor(post.authorId);

        return (
          <Link
            key={post.id}
            href={`/posts/${post.slug}`}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
          >
            <Card className="font-roboto overflow-hidden border border-border/60 p-0 shadow-none transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl">
              <div className="relative h-48 w-full overflow-hidden sm:h-56 lg:h-60">
                <Image
                  src={cover}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1280px) 640px, (min-width: 1024px) 520px, (min-width: 640px) 60vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  priority={false}
                />
              </div>
              <div className="flex flex-col justify-between bg-card">
                <div className="flex flex-col gap-5 px-6 py-6">
                  <div className="flex flex-wrap items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{dateLabel}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{numberFormatter.format(post.views ?? 0)} views</span>
                  </div>
                  <h2 className="text-2xl font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary sm:text-3xl">
                    {post.title}
                  </h2>
                  {excerptPreview ? (
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {excerptPreview}
                    </p>
                  ) : null}
                </div>
                <CardFooter className="border-t border-border/60 bg-card/80 px-6 py-4 pt-4 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground justify-between">
                  <span>{authorName}</span>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform duration-200 group-hover:translate-x-1">
                    Read article
                    <ArrowRight className="size-4" />
                  </span>
                </CardFooter>
              </div>
            </Card>
          </Link>
        );
      })}

      {paged.length === 0 && (
        <Card className="border-dashed text-center text-sm text-muted-foreground">
          <CardHeader>
            <CardTitle className="text-lg">No posts found</CardTitle>
            <CardDescription>
              Try searching for a different topic or check back soon for new stories.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
