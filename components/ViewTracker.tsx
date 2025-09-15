"use client";
import { useEffect, useRef } from 'react';

export default function ViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const key = `vw_s:${slug}`;
    try {
      const last = localStorage.getItem(key);
      const now = Date.now();
      if (last && now - Number(last) < 24 * 60 * 60 * 1000) return;
      fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) }).catch(() => {});
      localStorage.setItem(key, String(now));
    } catch {}
  }, [slug]);
  return null;
}

