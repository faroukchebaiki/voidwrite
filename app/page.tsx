import { fetchAllPosts, fetchAllTags, fetchSiteSettings } from '@/lib/sanity.queries';
import { Box, Container, Divider, Typography, Chip, Stack } from '@mui/material';
import PostCard from '@/components/PostCard';
import TopPosts from '@/components/TopPosts';
import Link from 'next/link';

export const revalidate = 60;

export default async function Home({ searchParams }: any) {
  const [settings, posts, tags] = await Promise.all([
    fetchSiteSettings(),
    fetchAllPosts(),
    fetchAllTags(),
  ]);

  const q = (searchParams?.q || '').toLowerCase();
  const filtered = q
    ? posts.filter(
        (p: any) => p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q)
      )
    : posts;

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom>
            {settings?.siteTitle || 'Voidwrite'}
          </Typography>
          {settings?.siteDescription && (
            <Typography variant="body1" color="text.secondary">{settings.siteDescription}</Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
          }}
        >
          <Box>
            <Stack spacing={2}>
              {filtered.map((post: any) => (
                <PostCard key={post._id} post={post} />
              ))}
              {filtered.length === 0 && (
                <Typography variant="body2" color="text.secondary">No posts found.</Typography>
              )}
            </Stack>
          </Box>
          <Box>
            <TopPosts />
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom>Tags</Typography>
              {tags.map((t: any) => (
                <Chip key={t._id} component={Link as any} href={`/tag/${t.slug.current}`} clickable label={t.title} sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </main>
  );
}
