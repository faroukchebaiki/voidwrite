"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function InviteClient({ list }: { list: Array<{ code: string; createdAt: string; createdBy: string; usedAt: string | null; usedBy: string | null }> }) {
  const [items, setItems] = useState(list);
  const [pending, startTransition] = useTransition();
  const onGenerate = async () => {
    startTransition(async () => {
      const res = await fetch('/api/invites', { method: 'POST' });
      if (res.ok) {
        const { code } = await res.json();
        setItems([{ code, createdAt: new Date().toISOString(), createdBy: 'you', usedAt: null, usedBy: null }, ...items]);
      }
    });
  };
  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => {
      toast.success('Invitation code copied to clipboard', { position: 'bottom-center', duration: 2000 });
    }).catch(()=>{});
  };
  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Invitations</h1>
        <button className="w-full rounded border px-3 py-2 text-sm sm:w-auto" onClick={onGenerate} disabled={pending}>{pending ? 'Generating…' : 'Generate code'}</button>
      </div>
      <div className="rounded border">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-2 p-2 text-xs text-muted-foreground sm:grid">
          <div>Code</div>
          <div>Created</div>
          <div>Creator</div>
          <div>Status</div>
          <div></div>
        </div>
        <div className="divide-y">
          {items.map((it) => (
            <div key={it.code} className="flex flex-col gap-2 p-3 text-sm sm:grid sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] sm:items-center">
              <div className="font-mono text-sm">{it.code}</div>
              <div className="text-muted-foreground text-xs sm:text-sm">{new Date(it.createdAt).toLocaleString()}</div>
              <div className="text-muted-foreground text-xs sm:text-sm">{it.createdBy}</div>
              <div className="text-muted-foreground text-xs sm:text-sm">{it.usedAt ? `Used by ${it.usedBy}` : 'Unused'}</div>
              <div className="sm:text-right">
                <button className="w-full rounded border px-2 py-1 text-xs sm:w-auto" onClick={()=>copy(it.code)}>Copy</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-3 text-sm text-muted-foreground">No invitation codes yet.</div>}
        </div>
      </div>
    </main>
  );
}
