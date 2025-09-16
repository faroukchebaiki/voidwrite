"use client";
import { useEffect, useState, useTransition } from "react";

type SiteSettings = {
  siteTitle: string;
  siteDescription: string | null;
  theme?: 'light'|'dark'|'system';
};

export default function SettingsForm() {
  const [data, setData] = useState<SiteSettings>({ siteTitle: "", siteDescription: "", theme: 'system' });
  const [loading, setLoading] = useState(true);
  const [saving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const json = await res.json();
        if (!aborted) setData({
          siteTitle: json?.siteTitle || '',
          siteDescription: json?.siteDescription || '',
          theme: (json?.theme === 'light' || json?.theme === 'dark' || json?.theme === 'system') ? json.theme : 'system',
        });
      } catch {
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setOk(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteTitle: data.siteTitle, siteDescription: data.siteDescription, theme: data.theme || 'system' }),
        });
        if (!res.ok) throw new Error('Failed to save settings');
        setOk('Saved');
      } catch (e: any) {
        setError(e.message || 'Error');
      }
    });
  };

  if (loading) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Site Settings</h2>
      <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
        <div>
          <label className="block text-sm mb-1">Site title</label>
          <input className="w-full border rounded px-3 py-2" value={data.siteTitle} onChange={(e)=>setData(v=>({...v, siteTitle: e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea rows={3} className="w-full border rounded px-3 py-2" value={data.siteDescription || ''} onChange={(e)=>setData(v=>({...v, siteDescription: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Default theme</label>
          <select className="w-full border rounded px-3 py-2" value={data.theme || 'system'} onChange={(e)=>setData(v=>({...v, theme: e.target.value as any}))}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">This sets the default for new visitors. Users can still toggle their own theme.</p>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={saving} className="px-3 py-2 border rounded">{saving ? 'Saving…' : 'Save settings'}</button>
          {ok && <span className="text-sm text-green-600">{ok}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </section>
  );
}
