import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが見つかりません。' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'ファイルサイズは10MB以下にしてください。' },
        { status: 400 }
      );
    }

    // Check extension
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const originalExt = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(originalExt)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PDF、JPG、PNG、WebP形式のファイルのみアップロード可能です。' 
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Safe random filename
    const hash = crypto.randomBytes(8).toString('hex');
    const safeFilename = `doc_${Date.now()}_${hash}${originalExt}`;

    // Target upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'verifications');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/verifications/${safeFilename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      message: '確認書類が正常にアップロードされました。',
    });
  } catch (error: any) {
    console.error('Error uploading verification document:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'ファイルのアップロードに失敗しました。' },
      { status: 500 }
    );
  }
}
