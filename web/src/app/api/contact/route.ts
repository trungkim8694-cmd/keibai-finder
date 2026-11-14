import { NextRequest, NextResponse } from 'next/server';
import { 
  sendContactInquiryNotificationEmail, 
  sendContactAutoReplyEmail 
} from '@/lib/emailService';

const CATEGORY_MAP: Record<string, string> = {
  SERVICE_USAGE: 'サービスのご利用・操作方法について',
  PROPERTY_DATA: '物件掲載・データに関するお問い合わせ',
  AGENCY_PARTNER: '不動産会社様・パートナー提携について',
  BUSINESS_PROPOSAL: '広告掲載・取材・その他ビジネス連携',
  OTHER: 'その他のお問い合わせ',
};

async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  // Allow test bypass in local development
  if (process.env.NODE_ENV === 'development' && (token === 'dev-test-token' || token === '1x00000000000000000000AA')) {
    return true;
  }

  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) {
    // If secret key is not set (e.g. offline dev), bypass verify
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const outcome = await res.json();
    return !!outcome.success;
  } catch (err) {
    console.error('[Turnstile Verify Error]:', err);
    // Fail-open or log error
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      category,
      companyName,
      name,
      furigana,
      email,
      phone,
      preferredContact = 'EMAIL',
      subject,
      message,
      agreePrivacy,
      turnstileToken,
      website_check, // Honeypot field
    } = body;

    // 1. Silent rejection for Honeypot trap (Bot Defense)
    if (website_check && website_check.trim() !== '') {
      console.warn('[Contact Form] Bot trapped via Honeypot field');
      return NextResponse.json(
        { success: true, message: 'お問い合わせを受け付けました。' },
        { status: 200 }
      );
    }

    // 2. Validate Required Fields
    if (!category || !name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '必須項目をすべて入力してください。' },
        { status: 400 }
      );
    }

    if (!agreePrivacy) {
      return NextResponse.json(
        { error: '個人情報の取り扱いへの同意が必要です。' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください。' },
        { status: 400 }
      );
    }

    if (message.trim().length < 5) {
      return NextResponse.json(
        { error: 'お問い合わせ内容は具体的に入力してください（5文字以上）。' },
        { status: 400 }
      );
    }

    // 3. Cloudflare Turnstile Verification
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     undefined;

    if (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'セキュリティ検証トークンが不足しています。ページを再読み込みしてください。' },
          { status: 400 }
        );
      }

      const isValidTurnstile = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!isValidTurnstile) {
        console.warn(`[Contact Form] Turnstile verification failed from IP: ${clientIp}`);
        return NextResponse.json(
          { error: 'セキュリティ認証（Bot検証）に失敗しました。もう一度送信してください。' },
          { status: 400 }
        );
      }
    }

    const categoryLabel = CATEGORY_MAP[category] || category;

    // 4. Send Email to TQC Admin team (info@keibai-koubai.com)
    await sendContactInquiryNotificationEmail({
      categoryLabel,
      companyName: companyName?.trim() || undefined,
      name: name.trim(),
      furigana: furigana?.trim() || undefined,
      email: email.trim(),
      phone: phone?.trim() || undefined,
      preferredContact,
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: clientIp,
    });

    // 5. Send Auto-reply confirmation to the customer
    await sendContactAutoReplyEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      categoryLabel,
      message: message.trim(),
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'お問い合わせを受け付けました。確認の自動返信メールをお送りいたしました。' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API /api/contact Error]:', error);
    return NextResponse.json(
      { error: '送信処理中にエラーが発生しました。時間をおいて再度お試しいただくか、お電話にてご連絡ください。' },
      { status: 500 }
    );
  }
}
