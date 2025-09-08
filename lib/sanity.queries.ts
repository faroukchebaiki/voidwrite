import groq from 'groq';
import { readClient } from './sanity.client';
const client: any = readClient;

export type Tag = {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
};

export type Author = {
  _id: string;
  name: string;
  slug?: { current: string };
  picture?: any;
  bio?: string;
  links?: { label: string; url: string }[];
};

export type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  coverImage?: any;
  author?: Author;
  tags?: Tag[];
  publishedAt?: string;
  body?: any[];
  views?: number;
};

export type SiteSettings = {
  siteTitle: string;
  siteDescription?: string;
  logo?: any;
  socialLinks?: { label: string; url: string }[];
};

export const allPostsQuery = groq`
  *[_type == "post"] | order(publishedAt desc)[0...50]{
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    publishedAt,
    "author": author-> { _id, name, slug, picture },
    "tags": tags[]-> { _id, title, slug },
    views
  }
`;

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    publishedAt,
    body,
    views,
    "author": author-> { _id, name, slug, picture, bio, links },
    "tags": tags[]-> { _id, title, slug }
  }
`;

export const postsByTagQuery = groq`
  *[_type == "post" && count(tags[@->slug.current == $tag]) > 0] | order(publishedAt desc)[0...50]{
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    publishedAt,
    views,
    "author": author-> { _id, name, slug },
    "tags": tags[]-> { _id, title, slug }
  }
`;

export const topPostsQuery = groq`
  *[_type == "post"] | order(coalesce(views, 0) desc, publishedAt desc)[0...$limit]{
    _id,
    title,
    slug,
    excerpt,
    views,
    coverImage
  }
`;

export const allTagsQuery = groq`
  *[_type == "tag"] | order(title asc){
    _id,
    title,
    slug,
    description
  }
`;

export const siteSettingsQuery = groq`
  *[_type == "settings"][0]{
    siteTitle,
    siteDescription,
    logo,
    socialLinks
  }
`;

export async function fetchAllPosts() {
  return client.fetch(allPostsQuery, {});
}

export async function fetchPostBySlug(slug: string) {
  return client.fetch(postBySlugQuery, { slug });
}

export async function fetchPostsByTag(tag: string) {
  return client.fetch(postsByTagQuery, { tag });
}

export async function fetchTopPosts(limit = 5) {
  return client.fetch(topPostsQuery, { limit });
}

export async function fetchAllTags() {
  return client.fetch(allTagsQuery, {});
}

export async function fetchSiteSettings() {
  return client.fetch(siteSettingsQuery, {});
}
