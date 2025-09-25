'use client';

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error', error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16 text-center font-roboto">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="size-6 animate-spin-slow" aria-hidden />
              <span className="text-sm uppercase tracking-[0.3em]">Something went wrong</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">We hit a snag</h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              An unexpected error occurred. Try refreshing the page or return to the home page while we look into it.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <RefreshCw className="size-4" aria-hidden />
              Retry
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/30 hover:text-primary/80"
            >
              Back home
            </Link>
          </div>
          {error?.digest && (
            <p className="text-xs text-muted-foreground/60">Error reference: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
