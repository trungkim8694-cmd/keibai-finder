// ==============================================================================
// Resend Email Service for Keibai-Koubai Portal (B2B Japanese Standard)
// ==============================================================================

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_API_KEY = process.env.RESEND_API_KEY || '';
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@keibai-koubai.com';

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  BIDDING_ASSIST: '入札代行・価格査定',
  OCCUPANT_NEGOTIATION: '占有者・明渡し交渉',
  RENOVATION: 'リフォーム・原状回復',
  GENERAL: '総合コンサルティング・その他',
};

const CONTACT_METHOD_LABELS: Record<string, string> = {
  PHONE: 'お電話',
  EMAIL: 'メール',
  LINE: 'LINE ID',
};

/**
 * Core function to send transactional email via Resend REST API
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY || DEFAULT_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  try {
    const payload: Record<string, any> = {
      from: fromEmail.includes('<') ? fromEmail : `keibai-koubai.com <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn(`[Resend Email] API notice (${res.status}):`, data?.message || data);
      return { success: false, error: data?.message || 'Failed to send email' };
    }

    console.log(`[Resend Email] Successfully sent email to ${Array.isArray(to) ? to.join(', ') : to} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('[Resend Email] Exception sending email:', error.message || error);
    return { success: false, error: error.message };
  }
}

/**
 * 1. Send consultation request email to a Verified Partner Agency
 */
export async function sendVerifiedAgencyLeadEmail(params: {
  agencyEmail: string;
  agencyName: string;
  customerName: string;
  contactMethod: string;
  contactValue: string;
  inquiryType: string;
  message?: string;
  saleUnitId?: string;
  crmDashboardUrl: string;
}) {
  const typeLabel = INQUIRY_TYPE_LABELS[params.inquiryType] || params.inquiryType;
  const methodLabel = CONTACT_METHOD_LABELS[params.contactMethod] || params.contactMethod;

  const subject = `【keibai-koubai.com】新しい入札サポート・相談依頼が届きました（${params.customerName}様）`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { background-color: #0f172a; color: #ffffff; padding: 20px 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 0.05em; }
    .content { padding: 24px; }
    .salutation { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .intro { font-size: 13px; color: #334155; margin-bottom: 20px; }
    .card { background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin-bottom: 20px; }
    .row { margin-bottom: 10px; font-size: 13px; }
    .row:last-child { margin-bottom: 0; }
    .label { font-weight: 700; color: #475569; width: 130px; display: inline-block; }
    .value { color: #0f172a; font-weight: 500; }
    .message-box { background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 12px; margin-top: 8px; font-size: 13px; white-space: pre-wrap; color: #1e293b; }
    .btn-container { text-align: center; margin: 28px 0 16px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 6px; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>keibai-koubai.com | 顧客相談通知</h1>
    </div>
    <div class="content">
      <div class="salutation">${params.agencyName} 御中</div>
      <div class="intro">
        いつもお世話になっております。全国競売・公売物件ポータル「keibai-koubai.com」運営事務局です。<br>
        貴社をサポート先として指定した新しい見込み客から、無料相談依頼が届きました。
      </div>

      <div class="card">
        <div class="row">
          <span class="label">お客様氏名:</span>
          <span class="value"><strong>${params.customerName} 様</strong></span>
        </div>
        <div class="row">
          <span class="label">相談種別:</span>
          <span class="value">${typeLabel}</span>
        </div>
        <div class="row">
          <span class="label">ご希望の連絡方法:</span>
          <span class="value">${methodLabel} (${params.contactValue})</span>
        </div>
        ${params.saleUnitId ? `
        <div class="row">
          <span class="label">対象物件ID:</span>
          <span class="value">${params.saleUnitId}</span>
        </div>` : ''}
        ${params.message ? `
        <div class="row" style="margin-top: 12px;">
          <span class="label">ご相談詳細:</span>
          <div class="message-box">${params.message}</div>
        </div>` : ''}
      </div>

      <p style="font-size: 12px; color: #64748b;">
        ※ お早めに顧客へご連絡いただくことで成約率が高まります。<br>
        ※ 状況のステータス管理はパートナー様専用CRMダッシュボードより行っていただけます。
      </p>

      <div class="btn-container">
        <a href="${params.crmDashboardUrl}" class="btn" target="_blank">CRM管理画面で確認・更新する</a>
      </div>
    </div>
    <div class="footer">
      本メールは keibai-koubai.com パートナー企業様向け自動送信メールです。<br>
      運営元: 株式会社TQC (東京都港区芝浦3-4-1 グランパークタワー)<br>
      お問い合わせ: info@keibai-koubai.com
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: params.agencyEmail,
    subject,
    html,
  });
}

/**
 * 2. Send invitation email to an Unverified Company with a 1-click claim token
 */
export async function sendUnverifiedAgencyClaimLeadEmail(params: {
  agencyEmail: string;
  agencyName: string;
  customerName: string;
  inquiryType: string;
  prefecture: string;
  claimUrl: string;
}) {
  const typeLabel = INQUIRY_TYPE_LABELS[params.inquiryType] || params.inquiryType;
  const subject = `【keibai-koubai.com】貴社宛てに競売物件の相談依頼が届いています（オーナー確認のお願い）`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { background-color: #0f172a; color: #ffffff; padding: 20px 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 16px; font-weight: 700; }
    .content { padding: 24px; }
    .salutation { font-size: 14px; font-weight: 600; margin-bottom: 16px; }
    .intro { font-size: 13px; color: #334155; margin-bottom: 20px; }
    .highlight-box { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #10b981; color: #ffffff !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 6px; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>keibai-koubai.com | オーナー確認のご案内</h1>
    </div>
    <div class="content">
      <div class="salutation">${params.agencyName} ご担当者様</div>
      <div class="intro">
        突然のご連絡失礼いたします。全国競売・公売物件ポータル「keibai-koubai.com」運営事務局です。<br><br>
        ポータルサイト上で${params.prefecture}の競売物件を閲覧中のお客様（${params.customerName}様）より、
        <strong>貴社を指名した「${typeLabel}」の相談依頼</strong>が届いております。
      </div>

      <div class="highlight-box">
        <p style="margin: 0; font-size: 13px; color: #1e3a8a; font-weight: 600;">
          顧客の連絡先情報の閲覧および直接の商談を開始するには、貴社のオーナー確認（無料）が必要です。
        </p>
      </div>

      <div class="btn-container">
        <a href="${params.claimUrl}" class="btn" target="_blank">無料でオーナー確認を完了して顧客情報を確認する</a>
      </div>

      <p style="font-size: 12px; color: #64748b;">
        ※ オーナー確認を完了すると、企業プロフィール（実績・対応エリア）の編集、および専任エージェントとしてのリード受信が可能になります。<br>
        ※ 初期費用・月額掲載料は一切かかりません。
      </p>
    </div>
    <div class="footer">
      keibai-koubai.com 運営元: 株式会社TQC (東京都港区芝浦3-4-1 グランパークタワー)<br>
      お問い合わせ: info@keibai-koubai.com
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: params.agencyEmail,
    subject,
    html,
  });
}

/**
 * 3. Send administrative alert to TQC Operations team
 */
export async function sendAdminLeadNotification(params: {
  customerName: string;
  contactMethod: string;
  contactValue: string;
  inquiryType: string;
  saleUnitId?: string;
  message?: string;
  targetCompanyName?: string;
  isVerified?: boolean;
  broadcastCompanyNames: string[];
}) {
  const typeLabel = INQUIRY_TYPE_LABELS[params.inquiryType] || params.inquiryType;
  const methodLabel = CONTACT_METHOD_LABELS[params.contactMethod] || params.contactMethod;

  const subject = `【管理者通知】新規相談リード獲得: ${params.customerName}様（${params.targetCompanyName || 'エリア配信'}）`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
    .box { max-width: 600px; margin: 16px auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
    h2 { font-size: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
    td.label { width: 140px; font-weight: bold; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="box">
    <h2>新規相談リード受付通知（管理用）</h2>
    <table>
      <tr><td class="label">相談種別</td><td>${typeLabel}</td></tr>
      <tr><td class="label">顧客氏名</td><td>${params.customerName} 様</td></tr>
      <tr><td class="label">希望連絡方法</td><td>${methodLabel} (${params.contactValue})</td></tr>
      ${params.saleUnitId ? `<tr><td class="label">対象物件ID</td><td>${params.saleUnitId}</td></tr>` : ''}
      <tr><td class="label">指名企業</td><td>${params.targetCompanyName ? `${params.targetCompanyName} (${params.isVerified ? '公式認証済' : '未認証'})` : '未指定'}</td></tr>
      <tr><td class="label">エリア配信先</td><td>${params.broadcastCompanyNames.length > 0 ? params.broadcastCompanyNames.join('、') : 'なし'}</td></tr>
      ${params.message ? `<tr><td class="label">相談メッセージ</td><td>${params.message}</td></tr>` : ''}
    </table>
    <p style="font-size: 11px; color: #64748b; margin-top: 16px;">
      keibai-koubai.com 自動システム配信
    </p>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject,
    html,
  });
}
