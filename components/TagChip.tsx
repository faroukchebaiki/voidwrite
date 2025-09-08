"use client";

import Link from 'next/link';
import { Chip } from '@mui/material';

export default function TagChip({ tag }: { tag: { title: string; slug: { current: string } } }) {
  return (
    <Chip
      size="small"
      component={Link as any}
      href={`/tag/${tag.slug.current}`}
      clickable
      label={tag.title}
      sx={{ mr: 0.5, mb: 0.5 }}
    />
  );
}

