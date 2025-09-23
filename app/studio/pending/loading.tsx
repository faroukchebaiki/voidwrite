export default function PendingLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="space-y-4 px-4 lg:px-6">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="animate-pulse rounded-xl border border-border/60 bg-card/70 p-5">
            <div className="h-4 w-2/3 rounded bg-muted/40" />
            <div className="mt-3 h-3 w-1/2 rounded bg-muted/30" />
            <div className="mt-5 flex items-center justify-between">
              <div className="h-3 w-1/5 rounded bg-muted/20" />
              <div className="h-8 w-24 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
