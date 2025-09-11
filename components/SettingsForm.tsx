"use client";
import { useState } from "react";

export default function SettingsForm({ initial }: { initial: any }) {
  const [siteTitle, setSiteTitle] = useState(initial?.siteTitle || "My Blog");
  const [siteDescription, setSiteDescription] = useState(initial?.siteDescription || "");
  const [theme, setTheme] = useState(initial?.theme || "system");
  const [saving, setSaving] = useState(false);
  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteTitle, siteDescription, theme }),
      });
      if (!res.ok) throw new Error("Failed to save");
      location.reload();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-3 max-w-lg">
      <div>
        <label className="block text-sm mb-1">Site title</label>
        <input className="w-full border rounded px-3 py-2" value={siteTitle} onChange={(e)=>setSiteTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm mb-1">Site description</label>
        <textarea className="w-full border rounded px-3 py-2" value={siteDescription} onChange={(e)=>setSiteDescription(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm mb-1">Theme</label>
        <select className="w-full border rounded px-3 py-2" value={theme} onChange={(e)=>setTheme(e.target.value)}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <button disabled={saving} onClick={onSave} className="border rounded px-3 py-2">{saving ? 'Saving…' : 'Save'}</button>
    </div>
  );
}

