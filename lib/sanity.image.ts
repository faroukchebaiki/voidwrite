import imageUrlBuilder from '@sanity/image-url';
import type { Image } from 'sanity';
import { publicEnv } from './env';

const builder = imageUrlBuilder({ projectId: publicEnv.projectId, dataset: publicEnv.dataset });

export function urlFor(source: Image | any) {
  return builder.image(source);
}
