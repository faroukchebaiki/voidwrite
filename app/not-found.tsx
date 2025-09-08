import { Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>404</Typography>
        <Typography variant="h5" gutterBottom>Page not found</Typography>
        <Typography variant="body1">Return to <Link href="/">home</Link>.</Typography>
      </Container>
    </main>
  );
}

