"use client";

import { useEffect, useRef } from "react";

export function SuspendedWatcher() {
  const triggeredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (cancelled || triggeredRef.current) return;
      try {
        const res = await fetch('/api/auth/session?update=1', { cache: 'no-store' });
        if (!res.ok) {
          triggeredRef.current = true;
          window.location.href = '/signin?error=suspended';
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data || !data.user) {
          triggeredRef.current = true;
          window.location.href = '/signin?error=suspended';
        }
      } catch {
        // ignore network errors
      }
    };

    void check();
    const interval = window.setInterval(check, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
