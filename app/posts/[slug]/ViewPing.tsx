"use client";

import { useEffect, useRef } from 'react';

export default function ViewPing({ slug }: { slug: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) {
      fired.current = true;
      return;
    }
    fired.current = true;
    fetch(`/api/views/${encodeURIComponent(slug)}`, { method: 'POST' }).catch(() => {});
    sessionStorage.setItem(key, '1');
  }, [slug]);
  return null;
}

