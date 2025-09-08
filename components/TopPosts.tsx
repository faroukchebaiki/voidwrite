import Link from 'next/link';
import { fetchTopPosts } from '@/lib/sanity.queries';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';

export default async function TopPosts({ limit = 5 }: { limit?: number }) {
  const posts = await fetchTopPosts(limit);
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Top posts</Typography>
      <List dense>
        {posts.map((p: any) => (
          <ListItem key={p._id} component={Link as any} href={`/posts/${p.slug.current}`} sx={{ px: 0 }}>
            <ListItemText primary={p.title} secondary={typeof p.views === 'number' ? `${p.views.toLocaleString()} views` : undefined} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
