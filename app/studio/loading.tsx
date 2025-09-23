export default function StudioLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="animate-pulse rounded-lg border border-border/60 bg-card/70 p-4">
            <div className="h-3 w-20 rounded bg-muted/40" />
            <div className="mt-4 h-8 w-24 rounded bg-muted/50" />
          </div>
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <div className="h-64 animate-pulse rounded-xl border border-border/60 bg-card/70" />
      </div>
      <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-2 lg:px-6">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="animate-pulse rounded-lg border border-border/60 bg-card/70 p-4">
            <div className="h-4 w-1/3 rounded bg-muted/40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((__, lineIdx) => (
                <div key={lineIdx} className="h-4 w-full rounded bg-muted/30" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
