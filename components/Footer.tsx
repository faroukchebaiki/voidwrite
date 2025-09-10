"use client";
import { Box, Container, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', mt: 6, py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Voidwrite. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
