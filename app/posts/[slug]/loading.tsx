export default function LoadingPost() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:py-12">
      <div className="space-y-6">
        <div className="h-40 w-full animate-pulse overflow-hidden rounded-xl bg-muted/30" />
        <div className="space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-muted/40" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted/30" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted/30" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted/20" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-4">
          <div className="size-14 animate-pulse rounded-full bg-muted/40" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted/30" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted/20" />
          </div>
        </div>
      </div>
    </main>
  );
}
