"use client";
import { useState } from "react";
import MarkdownIt from "markdown-it";
import Link from "next/link";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export default function Editor({ initial }: { initial: any }) {
  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [excerpt, setExcerpt] = useState(initial.excerpt || "");
  const [content, setContent] = useState(initial.content || "");
  const [status, setStatus] = useState(initial.status || "draft");
  const [saving, setSaving] = useState(false);
  const html = md.render(content || "");

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, excerpt, content, status }),
      });
      if (!res.ok) throw new Error("Failed to save");
      location.reload();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${initial.id}`, { method: "DELETE" });
    if (res.ok) location.href = "/admin/posts";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Post</h1>
        <div className="flex gap-2">
          <Link href="/admin/posts" className="text-sm underline">Back</Link>
          <button onClick={onDelete} className="text-sm text-red-600">Delete</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input className="w-full border rounded px-3 py-2" value={title} onChange={(e)=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input className="w-full border rounded px-3 py-2" value={slug} onChange={(e)=>setSlug(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Excerpt</label>
            <input className="w-full border rounded px-3 py-2" value={excerpt} onChange={(e)=>setExcerpt(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select className="w-full border rounded px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Markdown</label>
            <textarea className="w-full border rounded px-3 py-2 h-72" value={content} onChange={(e)=>setContent(e.target.value)} />
          </div>
          <button disabled={saving} onClick={onSave} className="border rounded px-3 py-2">{saving ? 'Saving…' : 'Save'}</button>
        </div>
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
