import { createClient as createNextSanityClient } from 'next-sanity';
import { createClient as createWriteClient } from '@sanity/client';
import { serverEnv } from './env';

export const apiVersion = '2023-10-01';

export const readClient = createNextSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion,
  useCdn: true,
  perspective: 'published',
});

export const serverReadClient = () => {
  const env = serverEnv();
  return createWriteClient({
    projectId: env.SANITY_API_PROJECT_ID,
    dataset: env.SANITY_API_DATASET,
    apiVersion,
    useCdn: false,
    token: env.SANITY_API_READ_TOKEN,
    perspective: 'published',
  });
};

export const serverWriteClient = () => {
  const env = serverEnv();
  return createWriteClient({
    projectId: env.SANITY_API_PROJECT_ID,
    dataset: env.SANITY_API_DATASET,
    apiVersion,
    useCdn: false,
    token: env.SANITY_API_WRITE_TOKEN,
    perspective: 'published',
  });
};

