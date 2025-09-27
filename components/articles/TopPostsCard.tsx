import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/site";

export type TopPostsCardEntry = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt: Date | null;
  totalViews: number;
};

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  month: "short",
  day: "numeric",
});

const numberFormatter = new Intl.NumberFormat(siteConfig.locale);

function formatPublished(date: Date | null) {
  if (!date) return "";
  return dateFormatter.format(date);
}

function formatViews(value: number) {
  return numberFormatter.format(Math.max(0, value));
}

export default function TopPostsCard({ posts }: { posts: TopPostsCardEntry[] }) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">Most viewed this week</CardTitle>
        <CardDescription>
          See what the {siteConfig.title} community couldn’t stop reading.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Stories are brewing in the studio—check back soon for fresh highlights.
          </p>
        ) : (
          <ol className="space-y-3">
            {posts.map((post, index) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="group block rounded-2xl border border-transparent px-3 py-2 transition hover:border-border hover:bg-muted/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground/80 transition group-hover:bg-foreground group-hover:text-background">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold leading-snug text-foreground">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPublished(post.publishedAt)} · {formatViews(post.totalViews)} views
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
