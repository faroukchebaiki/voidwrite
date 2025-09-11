"use client";

import Link from 'next/link';
import { AppBar, Toolbar, Typography, IconButton, Box, InputBase, alpha } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme, systemTheme } = useTheme();
  const [q, setQ] = useState('');
  const router = useRouter();
  const isAdmin = pathname?.startsWith('/admin');
  const mode = (theme === 'system' ? systemTheme : theme) === 'dark' ? 'dark' : 'light';
  const toggle = () => setTheme(mode === 'dark' ? 'light' : 'dark');

  if (isAdmin) return null;

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" component={Link} href="/" sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
          Voidwrite
        </Typography>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 1,
            backgroundColor: (t) => alpha(t.palette.action.hover, 0.3),
            '&:hover': { backgroundColor: (t) => alpha(t.palette.action.hover, 0.5) },
            marginRight: 2,
          }}
        >
          <Box sx={{ padding: '6px', position: 'absolute', height: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SearchIcon fontSize="small" />
          </Box>
          <InputBase
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                router.push(q ? `/?q=${encodeURIComponent(q)}` : '/');
              }
            }}
            sx={{
              paddingLeft: '32px',
              width: { xs: 120, sm: 200, md: 260 },
            }}
            inputProps={{ 'aria-label': 'search' }}
          />
        </Box>
        <IconButton aria-label="Toggle theme" onClick={toggle} size="small">
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
