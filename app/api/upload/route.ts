import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  // Validate content type and size
  const allowed = new Set(["image/png","image/jpeg","image/webp","image/gif"]);
  const type = (file as File).type || '';
  if (!allowed.has(type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  const arrayBuffer = await (file as File).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (buffer.byteLength > maxBytes) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
  const safeName = (file as File).name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '');
  const name = `images/${Date.now()}-${safeName}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 });
  const { url } = await put(name, buffer, { access: 'public', token, contentType: type });
  return NextResponse.json({ url });
}
