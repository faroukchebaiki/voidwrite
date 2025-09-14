"use client";
import { useState, useTransition } from "react";

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
  const copy = (code: string) => navigator.clipboard?.writeText(code).catch(()=>{});
  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invitations</h1>
        <button className="px-3 py-2 border rounded" onClick={onGenerate} disabled={pending}>{pending ? 'Generating…' : 'Generate code'}</button>
      </div>
      <div className="rounded border divide-y">
        <div className="grid grid-cols-5 gap-2 p-2 text-xs text-muted-foreground">
          <div>Code</div>
          <div>Created</div>
          <div>Creator</div>
          <div>Status</div>
          <div></div>
        </div>
        {items.map((it) => (
          <div key={it.code} className="grid grid-cols-5 gap-2 p-2 text-sm items-center">
            <div className="font-mono">{it.code}</div>
            <div>{new Date(it.createdAt).toLocaleString()}</div>
            <div>{it.createdBy}</div>
            <div>{it.usedAt ? `Used by ${it.usedBy}` : 'Unused'}</div>
            <div className="text-right"><button className="px-2 py-1 border rounded text-xs" onClick={()=>copy(it.code)}>Copy</button></div>
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-sm text-muted-foreground">No invitation codes yet.</div>}
      </div>
    </main>
  );
}

