import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    // Mật khẩu bảo vệ Webhook (nên đưa vào .env trong thực tế, nhưng hiện tại fix cứng hoặc kiểm tra chuỗi token)
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET || 'keibai_super_secret_4am'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Dọn dẹp Next.js Data Cache
    revalidateTag('daily-properties');
    revalidateTag('stats');
    
    // 2. Dọn dẹp Page Cache (ISR)
    revalidatePath('/market-insights');
    revalidatePath('/');

    console.log('[Webhook] Successfully revalidated properties and stats cache at 4AM');

    return NextResponse.json({
      revalidated: true,
      timestamp: Date.now(),
      message: "Cache flushed successfully"
    });
  } catch (error) {
    console.error("[Webhook] Revalidation error:", error);
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 });
  }
}
