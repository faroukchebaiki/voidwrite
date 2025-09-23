export default function PostsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="overflow-x-auto px-4 lg:px-6">
        <table className="min-w-full rounded-lg border border-border/60 bg-card/70">
          <thead>
            <tr className="border-b border-border/60">
              {Array.from({ length: 7 }).map((_, idx) => (
                <th key={idx} className="px-4 py-3 text-left">
                  <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border/60">
                {Array.from({ length: 7 }).map((__, colIdx) => (
                  <td key={colIdx} className="px-4 py-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted/30" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
