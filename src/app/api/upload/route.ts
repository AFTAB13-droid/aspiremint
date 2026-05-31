import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storageProvider } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    console.log('--- Upload Request Initialized ---');
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('Upload Aborted: No file in payload');
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // 4MB Vercel compatibility limit (Safe margin)
    if (file.size > 4 * 1024 * 1024) {
      console.log(`Upload Rejected: File size ${file.size} exceeds 4MB limit`);
      return NextResponse.json({ success: false, message: 'File too large (Max 4MB)' }, { status: 413 });
    }

    // MIME Type Validation
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      console.log(`Upload Rejected: Invalid file type ${file.type}`);
      return NextResponse.json({ success: false, message: 'Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.' }, { status: 415 });
    }

    // Diagnostic check for storage configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.error('CRITICAL: Cloudinary credentials missing from environment');
      return NextResponse.json({ success: false, message: 'Storage configuration error' }, { status: 500 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await storageProvider.upload(buffer, file.name);

    return NextResponse.json({ 
      success: true, 
      url: fileUrl 
    });
  } catch (error: any) {
    console.error('Upload Error Details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      syscall: error.syscall
    });
    const safeMessage = error.code === 'ECONNRESET'
      ? 'Connection reset by storage provider. Please try again.'
      : 'Upload failed. Please try again.';
    return NextResponse.json({ 
      success: false, 
      message: safeMessage
    }, { status: 500 });
  }
}
