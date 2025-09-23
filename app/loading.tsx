export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-full bg-muted/40" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <section className="space-y-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm"
              >
                <div className="h-48 bg-muted/40 sm:h-56 lg:h-60" />
                <div className="flex flex-col justify-between">
                  <div className="space-y-4 px-6 py-6">
                    <div className="flex gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="h-3 w-16 rounded-full bg-muted/50" />
                      <span className="h-3 w-10 rounded-full bg-muted/50" />
                    </div>
                    <div className="h-6 w-4/5 rounded bg-muted/50" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-muted/40" />
                      <div className="h-4 w-5/6 rounded bg-muted/40" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 bg-card/60 px-6 py-4">
                    <span className="h-3 w-24 rounded-full bg-muted/50" />
                    <span className="h-3 w-16 rounded-full bg-muted/50" />
                  </div>
                </div>
              </div>
            ))}
          </section>
          <aside className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card/70 p-6">
              <div className="h-6 w-1/3 rounded-full bg-muted/50" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full rounded bg-muted/40" />
                <div className="h-4 w-5/6 rounded bg-muted/40" />
                <div className="h-9 w-full rounded bg-muted/60" />
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 p-6">
              <div className="h-5 w-1/4 rounded-full bg-muted/50" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 6 }).map((_, tagIdx) => (
                  <div key={tagIdx} className="h-6 w-1/2 rounded-full bg-muted/40" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
