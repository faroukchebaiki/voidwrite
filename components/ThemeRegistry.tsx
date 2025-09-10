"use client";

import * as React from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useTheme } from 'next-themes';
import { getMuiTheme } from '@/lib/theme';

function createEmotionCache() {
  return createCache({ key: 'mui', prepend: true });
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const cache = React.useMemo(() => createEmotionCache(), []);
  const { theme: resolvedTheme, systemTheme } = useTheme();
  const mode = (resolvedTheme === 'system' ? systemTheme : resolvedTheme) === 'dark' ? 'dark' : 'light';

  // NOTE: Server-inserted Emotion styles can cause hydration mismatches
  // when used inside client components. We rely on client-side injection
  // to avoid SSR/client drift.

  return (
    <CacheProvider value={cache}>
      <MuiThemeProvider theme={getMuiTheme(mode)}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  );
}
