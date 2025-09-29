import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { IMAGE_ALLOWED_TYPES, IMAGE_UPLOAD_MAX_BYTES, IMAGE_VARIANT_WIDTHS } from "@/lib/uploads";
import { requireStaff } from "@/lib/auth-helpers";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await requireStaff();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  const type = (file as File).type || '';
  if (!IMAGE_ALLOWED_TYPES.has(type)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  const arrayBuffer = await (file as File).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const rawLimit = 10 * 1024 * 1024; // prevent extremely large uploads
  if (buffer.byteLength > rawLimit) return NextResponse.json({ error: 'File too large (max 10MB raw)' }, { status: 413 });

  const safeName = (file as File).name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '');
  const baseName = `images/${Date.now()}-${safeName.replace(/\.[^.]+$/, '')}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 });

  const createVariant = async (width: number) => {
    const qualityLevels = [80, 72, 64, 56, 48];
    for (const quality of qualityLevels) {
      const resized = await sharp(buffer, { failOn: 'none' })
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
      if (resized.byteLength <= IMAGE_UPLOAD_MAX_BYTES) {
        return resized;
      }
    }
    throw new Error('Unable to compress image under limit');
  };

  const variantBuffers: { label: string; data: Buffer }[] = [];
  for (const width of IMAGE_VARIANT_WIDTHS) {
    const data = await createVariant(width);
    variantBuffers.push({ label: `${width}w`, data });
  }

  // If the original image is already smaller than the smallest variant
  if (!variantBuffers.length) {
    variantBuffers.push({ label: 'original', data: buffer });
  }

  const uploads = await Promise.all(
    variantBuffers.map(async ({ label, data }) => {
      const name = `${baseName}-${label}.webp`;
      const result = await put(name, data, { access: 'public', token, contentType: 'image/webp' });
      return { label, url: result.url, size: data.byteLength };
    })
  );

  const primary = uploads.find((v) => v.label === '1600w') || uploads[0];
  const variants = Object.fromEntries(uploads.map(({ label, url }) => [label, url]));

  return NextResponse.json({ url: primary.url, variants });
}
