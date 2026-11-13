import { NextRequest, NextResponse } from 'next/server';
import { SeoArticleAgent } from '@/lib/seoArticleAgent';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Hỗ trợ chạy tối đa 60s trên serverless

function isAuthorized(request: NextRequest, sessionUserRole?: string): boolean {
  // 1. Cho phép Admin đang đăng nhập thực hiện thủ công
  if (sessionUserRole === 'ADMIN') {
    return true;
  }

  // 2. Kiểm tra bí mật CRON_SECRET (cho Vercel Cron, GitHub Actions, external Cron)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get('key');

  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret) {
      return true;
    }
  }

  // 3. Cho phép chạy trên môi trường phát triển cục bộ (localhost)
  const host = request.headers.get('host') || '';
  if (process.env.NODE_ENV === 'development' || host.includes('localhost') || host.includes('127.0.0.1')) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!isAuthorized(request, userRole)) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId') || undefined;
    const category = (searchParams.get('category') as any) || undefined;
    const dryRun = searchParams.get('dryRun') === 'true';

    const result = await SeoArticleAgent.run({
      keywordId,
      category,
      dryRun
    });

    return NextResponse.json({
      success: true,
      message: dryRun ? 'SEO article generated (Dry Run mode)' : 'SEO article generated and published successfully',
      result
    });
  } catch (error: any) {
    console.error('Error in SEO Article Cron:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!isAuthorized(request, userRole)) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body rỗng không sao
    }

    const { keywordId, category, forceCategory, dryRun } = body;

    const result = await SeoArticleAgent.run({
      keywordId,
      category,
      forceCategory,
      dryRun: Boolean(dryRun)
    });

    return NextResponse.json({
      success: true,
      message: dryRun ? 'SEO article generated (Dry Run mode)' : 'SEO article generated and published successfully',
      result
    });
  } catch (error: any) {
    console.error('Error in SEO Article Cron POST:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
