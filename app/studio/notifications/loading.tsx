export default function NotificationsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="space-y-4 px-4 lg:px-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse rounded-lg border border-border/60 bg-card/70 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-muted/40" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-muted/40" />
                <div className="h-3 w-2/3 rounded bg-muted/30" />
                <div className="h-3 w-1/3 rounded bg-muted/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
