import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: '有効なメールアドレスを入力してください。' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Rate Limit (60 seconds)
    const existing = await (prisma as any).authOtpToken.findUnique({
      where: { email: cleanEmail },
    });

    if (existing && existing.lastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existing.lastSentAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        const waitSeconds = 60 - elapsedSeconds;
        return NextResponse.json(
          {
            success: false,
            error: `セキュリティ保護のため、次の認証コード送信まであと ${waitSeconds} 秒お待ちください。`,
            remainingSeconds: waitSeconds,
          },
          { status: 429 }
        );
      }
    }

    // 2. Generate 6-digit OTP code & 32-byte Magic Link Token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const magicToken = crypto.randomBytes(32).toString('hex');
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 3. Save to database
    await (prisma as any).authOtpToken.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        otpCode,
        otpExpires,
        token: magicToken,
        tokenExpires,
        attempts: 0,
        lastSentAt: new Date(),
      },
      update: {
        otpCode,
        otpExpires,
        token: magicToken,
        tokenExpires,
        attempts: 0,
        lastSentAt: new Date(),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/login/verify?token=${magicToken}&email=${encodeURIComponent(cleanEmail)}`;

    console.log(`\n======================================================`);
    console.log(`[AUTH] OTP & Magic Link generated for: ${cleanEmail}`);
    console.log(`[AUTH] 6-digit OTP: ${otpCode} (Valid for 10 mins)`);
    console.log(`[AUTH] Magic Link: ${verifyUrl}`);
    console.log(`======================================================\n`);

    // 4. Send Email via Resend if API key is present
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'keibai-koubai <auth@keibai-koubai.com>';
        const subject = `【keibai-koubai.com】ログイン認証コード: ${otpCode}`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans JP', sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">
                <span style="color: #1B4F8A;">keibai</span>-<span style="color: #b91c1c;">koubai</span>.com
              </h1>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">全国不動産競売・公売データベース</p>
            </div>

            <p style="font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
              平素は keibai-koubai.com をご利用いただき誠にありがとうございます。<br />
              ログイン・会員登録用の認証コードおよびワンクリックログインリンクをお届けします。
            </p>

            <!-- OTP CODE BOX -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
                ログイン認証コード (6桁)
              </div>
              <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1B4F8A; font-family: monospace;">
                ${otpCode}
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
                ※有効期限: 10分間（画面の入力欄にそのままご入力ください）
              </div>
            </div>

            <!-- MAGIC LINK BUTTON -->
            <div style="text-align: center; margin: 28px 0;">
              <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">または以下のボタンをクリックして直接ログイン:</p>
              <a href="${verifyUrl}" style="display: inline-block; background-color: #1B4F8A; color: #ffffff; padding: 12px 28px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                ワンクリックでログインする ↗
              </a>
              <p style="font-size: 10px; color: #94a3b8; margin-top: 8px;">※リンク有効期限: 7日間</p>
            </div>

            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
              ※このメールに心当たりがない場合は、安全のため本メールを破棄してください。<br />
              © keibai-koubai.com All Rights Reserved.
            </p>
          </div>
        `;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: cleanEmail,
            subject,
            html,
          }),
        });
      } catch (emailErr) {
        console.error('Error sending email via Resend:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: '認証コードをメール宛に送信しました。メールに記載の6桁コードをご入力いただくか、リンクをクリックしてログインしてください。',
      // For development ease, include simulated info when Resend is not configured
      simulated: !resendApiKey,
      simulatedOtp: !resendApiKey ? otpCode : undefined,
      simulatedVerifyUrl: !resendApiKey ? verifyUrl : undefined,
    });
  } catch (error: any) {
    console.error('Error in send-otp-link API:', error);
    return NextResponse.json(
      { success: false, error: '認証コードの送信中にエラーが発生しました。時間を置いて再度お試しください。' },
      { status: 500 }
    );
  }
}
