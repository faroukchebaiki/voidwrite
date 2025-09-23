export default function SettingsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="space-y-4 px-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="animate-pulse rounded-xl border border-border/60 bg-card/70 p-6">
            <div className="h-4 w-1/3 rounded bg-muted/40" />
            <div className="mt-4 space-y-3">
              <div className="h-9 w-full rounded bg-muted/30" />
              <div className="h-9 w-5/6 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
