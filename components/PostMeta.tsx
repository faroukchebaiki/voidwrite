import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import TagChip from './TagChip';

type Props = {
  author?: { name?: string; slug?: { current: string } } | null;
  date?: string;
  tags?: { title: string; slug: { current: string } }[];
  views?: number;
};

export default function PostMeta({ author, date, tags, views }: Props) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      {author?.name && (
        <Typography variant="body2" color="text.secondary">By {author.name}</Typography>
      )}
      {date && (
        <Typography variant="body2" color="text.secondary">
          {dayjs(date).format('MMM D, YYYY')}
        </Typography>
      )}
      {typeof views === 'number' && (
        <Typography variant="body2" color="text.secondary">{views.toLocaleString()} views</Typography>
      )}
      <Box>
        {tags?.map((t) => (
          <TagChip key={t.slug.current} tag={t} />
        ))}
      </Box>
    </Stack>
  );
}

