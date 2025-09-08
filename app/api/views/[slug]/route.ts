import { NextResponse } from 'next/server';
import groq from 'groq';
import { serverReadClient, serverWriteClient } from '@/lib/sanity.client';

const bySlug = groq`*[_type == "post" && slug.current == $slug][0]{ _id, views }`;

export async function GET(_: Request, context: any) {
  const { params } = context;
  const { slug } = params;
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  const doc = await serverReadClient().fetch(bySlug, { slug });
  return NextResponse.json({ views: doc?.views ?? 0 });
}

export async function POST(_: Request, context: any) {
  const { params } = context;
  const { slug } = params;
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Write token not configured' }, { status: 501 });
  }
  const read = serverReadClient();
  const write = serverWriteClient();
  const doc = await read.fetch<{ _id: string; views?: number } | null>(bySlug, { slug });
  if (!doc?._id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const res = await write
    .patch(doc._id)
    .setIfMissing({ views: 0 })
    .inc({ views: 1 })
    .commit({ returnDocuments: true });
  return NextResponse.json({ views: res.views ?? 0 });
}
