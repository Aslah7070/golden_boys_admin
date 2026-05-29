import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary details
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'diau0pn3x';
    const apiKey = process.env.CLOUDINARY_API_KEY || '516561277154165';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '53DFL5HgorZ_XC4bWPVSR5uJKa8';

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const folder = 'golden_boys';

    // Generate signature
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

    // Prepare Cloudinary request
    const cloudinaryFormData = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    cloudinaryFormData.append('file', blob, file.name);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Cloudinary upload failed' }, { status: 500 });
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload error' }, { status: 500 });
  }
}
