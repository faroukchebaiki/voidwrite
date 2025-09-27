"use client";

export function SuspendedBanner({ error }: { error?: string | null }) {
  if (error !== "suspended") return null;
  return (
    <div className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
      Your account has been suspended. Please reach out to an administrator if you believe this is a mistake.
    </div>
  );
}
