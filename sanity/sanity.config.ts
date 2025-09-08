import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import post from './schemas/post';
import tag from './schemas/tag';
import author from './schemas/author';
import settings from './schemas/settings';

export default defineConfig({
  name: 'default',
  title: 'Voidwrite Studio',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: '/studio',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [post, tag, author, settings],
  },
});

