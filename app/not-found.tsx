import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Compass className="size-6" aria-hidden />
          <span className="text-sm uppercase tracking-[0.3em]">404</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">We couldn&apos;t find that page</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          The link may be outdated or the page was removed. Explore our latest stories or head back to the home page.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>
        <Link
          href="/tag"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/30 hover:text-primary/80"
        >
          Browse tags
        </Link>
      </div>
    </main>
  );
}
