import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  const arrayBuffer = await (file as File).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const name = `images/${Date.now()}-${(file as File).name}`.replace(/\s+/g, '-');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 });
  const { url } = await put(name, buffer, { access: 'public', token });
  return NextResponse.json({ url });
}

