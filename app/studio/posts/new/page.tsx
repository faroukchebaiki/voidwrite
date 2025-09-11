"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import RichEditor from "@/components/RichEditor";
import Image from "next/image";
import dayjs from "dayjs";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const requiredFilled = useMemo(() => !!title && !!excerpt && !!coverImageUrl, [title, excerpt, coverImageUrl]);

  const genId = () => Math.random().toString(36).slice(2, 8);
  const genSlug = () => `${dayjs().format("YYYYMMDD")}-${genId()}`;

  const submit = async (publish: boolean) => {
    setSaving(true);
    try {
      const effSlug = slug || genSlug();
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug: effSlug, excerpt, content, status: publish ? "published" : "draft", coverImageUrl }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      location.href = `/studio/posts/${data.id}`;
    } finally {
      setSaving(false);
    }
  };
  const onSave = () => submit(false);
  const onPublish = () => submit(true);

  const clickUpload = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const body = new FormData();
    body.append('file', f);
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) { alert('Upload failed'); return; }
    const { url } = await res.json();
    setCoverImageUrl(url);
  };
  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))]/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <h1 className="text-lg font-semibold">Write a blog</h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onSave} disabled={saving} className="px-3 py-1 border rounded text-sm">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={onPublish} disabled={!requiredFilled || saving} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Publish</button>
            <Link href="/studio/posts" className="text-sm underline">Back</Link>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto w-full space-y-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input className="w-full border rounded px-3 py-2" value={title} onChange={(e)=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Short description</label>
            <input className="w-full border rounded px-3 py-2" value={excerpt} onChange={(e)=>setExcerpt(e.target.value)} placeholder="Brief summary of the post" />
          </div>
          <div>
            <label className="block text-sm mb-1">Cover image</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clickUpload} className="px-3 py-1 border rounded text-sm">Upload cover image</button>
              <input ref={fileRef} onChange={onFile} type="file" accept="image/*" className="hidden" />
            </div>
            {coverImageUrl && (
              <div className="mt-2">
                <Image src={coverImageUrl} alt="Cover preview" width={800} height={450} className="max-h-48 rounded border w-auto h-auto" unoptimized />
              </div>
            )}
          </div>
        </div>
        <div className="max-w-3xl mx-auto w-full">
          <RichEditor initialHTML="" onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
