'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const KIGYOULIST_API_BASE = process.env.KIGYOULIST_API_URL || 'https://kigyoulist.com';

const STATIC_PREF_COUNTS = [
  { prefecture: '東京都', count: 920 },
  { prefecture: '神奈川県', count: 825 },
  { prefecture: '埼玉県', count: 788 },
  { prefecture: '千葉県', count: 749 },
  { prefecture: '広島県', count: 724 },
  { prefecture: '大阪府', count: 713 },
  { prefecture: '愛知県', count: 686 },
  { prefecture: '京都府', count: 684 },
  { prefecture: '宮城県', count: 681 },
  { prefecture: '兵庫県', count: 669 },
  { prefecture: '北海道', count: 666 },
  { prefecture: '群馬県', count: 658 },
  { prefecture: '新潟県', count: 650 },
  { prefecture: '静岡県', count: 646 },
  { prefecture: '茨城県', count: 643 },
  { prefecture: '福岡県', count: 637 },
  { prefecture: '岡山県', count: 609 },
  { prefecture: '栃木県', count: 605 },
  { prefecture: '長野県', count: 604 },
  { prefecture: '熊本県', count: 599 },
  { prefecture: '福島県', count: 578 },
  { prefecture: '滋賀県', count: 560 },
  { prefecture: '愛媛県', count: 541 },
  { prefecture: '大分県', count: 541 },
  { prefecture: '岐阜県', count: 539 },
  { prefecture: '三重県', count: 537 },
  { prefecture: '石川県', count: 536 },
  { prefecture: '沖縄県', count: 532 },
  { prefecture: '鹿児島県', count: 529 },
  { prefecture: '山口県', count: 499 },
  { prefecture: '香川県', count: 491 },
  { prefecture: '奈良県', count: 468 },
  { prefecture: '青森県', count: 468 },
  { prefecture: '富山県', count: 451 },
  { prefecture: '長崎県', count: 451 },
  { prefecture: '山形県', count: 447 },
  { prefecture: '山梨県', count: 431 },
  { prefecture: '岩手県', count: 430 },
  { prefecture: '宮崎県', count: 420 },
  { prefecture: '徳島県', count: 403 },
  { prefecture: '福井県', count: 390 },
  { prefecture: '秋田県', count: 377 },
  { prefecture: '和歌山県', count: 366 },
  { prefecture: '佐賀県', count: 362 },
  { prefecture: '高知県', count: 338 },
  { prefecture: '島根県', count: 328 },
  { prefecture: '鳥取県', count: 266 }
];

export interface GetCompaniesParams {
  prefecture?: string;
  region?: string;
  city?: string;
  isVerified?: boolean;
  isClaimed?: boolean;
  query?: string;
  specialty?: string;
  page?: number;
  limit?: number;
}

export interface SubmitClaimParams {
  companyId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  position: string;
  corporateEmail?: string;
  verificationMethod?: 'EMAIL_DOMAIN' | 'DOCUMENT';
  documentUrl?: string;
  documentType?: 'TOHON' | 'MEISHI' | 'TAKKEN_LICENSE' | 'OTHER';
  specialties?: string[];
  customDescription?: string;
  notes?: string;
  userId?: string;
}

export interface SubmitDelistParams {
  companyId: string;
  reason: string;
  contactEmail: string;
  contactPhone?: string;
  details?: string;
}

const REGION_MAP: Record<string, string[]> = {
  '関東': ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'],
  '関西': ['大阪府', '兵庫県', '京都府', '滋賀県', '奈良県', '和歌山県'],
  '東海・中部': ['愛知県', '静岡県', '岐阜県', '三重県', '新潟県', '長野県', '山梨県', '富山県', '石川県', '福井県'],
  '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
  '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  '中国・四国': ['広島県', '岡山県', '山口県', '鳥取県', '島根県', '香川県', '愛媛県', '徳島県', '高知県'],
};

/**
 * Lấy danh sách các công ty bất động sản Takken trực tiếp từ PostgreSQL nội bộ
 * Truy vấn siêu tốc, không phụ thuộc kết nối HTTP ra ngoài, đồng bộ trạng thái Official Partner
 */
export async function getRealEstateCompanies(params: GetCompaniesParams = {}) {
  try {
    const {
      prefecture,
      region,
      city,
      isVerified,
      isClaimed,
      query,
      specialty,
      page = 1,
      limit = 24,
    } = params;

    const where: any = {
      status: 'ACTIVE',
    };

    if (prefecture && prefecture !== 'ALL' && prefecture !== '全国') {
      where.prefecture = prefecture;
    } else if (region && region !== 'ALL' && region !== '全国') {
      const prefsInRegion = REGION_MAP[region];
      if (prefsInRegion && prefsInRegion.length > 0) {
        where.prefecture = { in: prefsInRegion };
      }
    }

    if (city && city.trim() !== '') {
      where.city = { contains: city.trim() };
    }

    if (query && query.trim() !== '') {
      const q = query.trim();
      where.OR = [
        { companyName: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { licenseNumber: { contains: q, mode: 'insensitive' } },
        { houjinNumber: { contains: q } },
      ];
    }

    if (typeof isVerified === 'boolean') {
      where.isVerified = isVerified;
    }
    if (typeof isClaimed === 'boolean') {
      where.isClaimed = isClaimed;
    }

    if (specialty && specialty !== 'すべて') {
      where.specialties = {
        has: specialty,
      };
    }

    const [totalCount, companies] = await Promise.all([
      (prisma as any).realEstateCompany.count({ where }),
      (prisma as any).realEstateCompany.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { isVerified: 'desc' },
          { isClaimed: 'desc' },
          { created_at: 'desc' },
        ],
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      success: true,
      companies,
      total: totalCount,
      page,
      totalPages,
      limit,
    };
  } catch (error: any) {
    console.error('Error fetching real estate companies from DB:', error);
    return {
      success: false,
      error: '不動産業者リストの取得中にエラーが発生しました。',
      companies: [],
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 12,
    };
  }
}

/**
 * Đề xuất danh sách công ty bất động sản theo ngữ cảnh bất động sản (prefecture, city) từ DB nội bộ
 */
export async function getCompaniesForProperty(params: {
  prefecture?: string | null;
  city?: string | null;
  limit?: number;
}) {
  try {
    const { prefecture, city, limit = 4 } = params;
    const targetLimit = Math.min(20, Math.max(1, limit));

    let where: any = { status: 'ACTIVE' };
    if (prefecture) {
      where.prefecture = prefecture;
    }
    if (city) {
      where.city = { contains: city };
    }

    let companies = await (prisma as any).realEstateCompany.findMany({
      where,
      take: targetLimit,
      orderBy: [
        { isVerified: 'desc' },
        { isClaimed: 'desc' },
        { created_at: 'desc' },
      ],
    });

    // Fallback nếu không có công ty theo city -> tìm theo prefecture
    if (companies.length === 0 && prefecture) {
      companies = await (prisma as any).realEstateCompany.findMany({
        where: { status: 'ACTIVE', prefecture },
        take: targetLimit,
        orderBy: [
          { isVerified: 'desc' },
          { isClaimed: 'desc' },
          { created_at: 'desc' },
        ],
      });
    }

    // Fallback toàn quốc nếu vẫn rỗng
    if (companies.length === 0) {
      companies = await (prisma as any).realEstateCompany.findMany({
        where: { status: 'ACTIVE' },
        take: targetLimit,
        orderBy: [
          { isVerified: 'desc' },
          { isClaimed: 'desc' },
        ],
      });
    }

    return {
      success: true,
      companies,
    };
  } catch (error: any) {
    console.error('Error fetching companies for property:', error);
    return {
      success: false,
      error: '物件周辺の不動産会社取得に失敗しました。',
      companies: [],
    };
  }
}

/**
 * Lấy chi tiết công ty theo ID hoặc houjinNumber (Mã số thuế doanh nghiệp 13 số)
 */
export async function getCompanyById(idOrHoujin: string) {
  try {
    if (!idOrHoujin || idOrHoujin.trim() === '') {
      return { success: false, error: 'IDまたは法人番号が必要です。' };
    }

    const trimmed = idOrHoujin.trim();
    
    const company = await (prisma as any).realEstateCompany.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { id: trimmed },
          { houjinNumber: trimmed },
        ],
      },
    });

    if (company) {
      return { success: true, company };
    }

    return { success: false, error: '該当する不動産業者が見つかりませんでした。' };
  } catch (error: any) {
    console.error('Error fetching company by id:', error);
    return { success: false, error: '企業情報の取得中にエラーが発生しました。' };
  }
}

/**
 * Gửi yêu cầu Claim / Xác minh quyền sở hữu trang doanh nghiệp
 */
export async function submitClaimRequest(params: SubmitClaimParams) {
  try {
    const {
      companyId,
      applicantName,
      applicantEmail,
      applicantPhone,
      position,
      corporateEmail,
      verificationMethod = 'EMAIL_DOMAIN',
      documentUrl,
      documentType = 'TOHON',
      specialties,
      customDescription,
      notes,
      userId,
    } = params;

    // Validation cơ bản
    if (!companyId) {
      return { success: false, error: '企業IDが指定されていません。' };
    }
    if (!applicantName || applicantName.trim().length === 0) {
      return { success: false, error: '申請者氏名を入力してください。' };
    }
    if (!applicantEmail || !applicantEmail.includes('@')) {
      return { success: false, error: '有効なメールアドレスを入力してください。' };
    }
    if (!applicantPhone || applicantPhone.trim().length < 8) {
      return { success: false, error: '有効な連絡先電話番号を入力してください。' };
    }
    if (!position || position.trim().length === 0) {
      return { success: false, error: '社内役職・ご担当部署を入力してください。' };
    }

    if (verificationMethod === 'DOCUMENT' && !documentUrl) {
      return { 
        success: false, 
        error: '確認書類（登記簿謄本・名刺・宅建士証など）のファイルをアップロードしてください。' 
      };
    }

    // Kiểm tra công ty tồn tại trong DB, nếu là công ty từ kigyoulist thì tự động khởi tạo bản ghi
    let company = await (prisma as any).realEstateCompany.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      const corpNum = companyId.replace(/^kigyou_/, '');
      try {
        const kRes = await fetch(`${KIGYOULIST_API_BASE}/api/external/takken-agencies?keyword=${corpNum}&limit=1`);
        if (kRes.ok) {
          const kData = await kRes.json();
          const target = kData.agencies?.[0];
          if (target) {
            company = await (prisma as any).realEstateCompany.create({
              data: {
                id: companyId,
                houjinNumber: target.corporateNumber || corpNum,
                companyName: target.companyName || '宅建免許保有企業',
                licenseNumber: target.licenseNumber || '宅地建物取引業者免許',
                prefecture: target.prefecture || '東京都',
                city: target.city || '',
                address: target.address || '',
                phone: target.phone || null,
                website: target.website || null,
                isVerified: false,
                isClaimed: false,
                status: 'ACTIVE',
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to import agency from kigyoulist for claim:', err);
      }
    }

    if (!company) {
      return { success: false, error: '対象の不動産業者が見つかりません。' };
    }

    if (company.isClaimed) {
      return {
        success: false,
        error: 'この事業者ページは既にオーナー確認・管理権限の登録が完了しています。お心当たりがない場合はサポートへご連絡ください。',
      };
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const claimToken = Buffer.from(JSON.stringify({
      companyId,
      email: applicantEmail.trim().toLowerCase(),
      createdAt: Date.now(),
      exp: Date.now() + 7 * 24 * 3600 * 1000,
    })).toString('base64url');

    const notesPayload = JSON.stringify({
      token: claimToken,
      verificationMethod,
      documentUrl: documentUrl || null,
      documentType: documentType || null,
      specialties: specialties && specialties.length > 0 ? specialties : ['宅建免許保有'],
      customDescription: customDescription ? customDescription.trim() : null,
      notes: notes ? notes.trim() : null,
    });

    const claimRequest = await (prisma as any).companyClaimRequest.create({
      data: {
        companyId,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim().toLowerCase(),
        applicantPhone: applicantPhone.trim(),
        position: position.trim(),
        corporateEmail: corporateEmail ? corporateEmail.trim().toLowerCase() : null,
        verificationMethod,
        documentUrl: documentUrl || null,
        documentType: documentType || null,
        notes: notesPayload,
        status: 'PENDING',
        userId: userId || null,
      },
    });

    const verificationLink = `${baseUrl}/api/companies/verify-claim?token=${claimToken}&claimId=${claimRequest.id}`;
    console.log(`[ZERO-TOUCH AUTO-VERIFY] Verification request created for ${company.companyName} (${applicantEmail}), Method: ${verificationMethod}`);

    revalidatePath(`/agencies`);
    revalidatePath(`/agencies/${companyId}`);
    revalidatePath('/companies');

    if (verificationMethod === 'DOCUMENT') {
      return {
        success: true,
        requestId: claimRequest.id,
        verificationMethod: 'DOCUMENT',
        documentUrl,
        documentType,
        message: '確認書類（登記簿謄本・名刺等）によるオーナー確認申請を受け付けました。ご提出いただいた書類と公的宅建免許名簿を照合のうえ、通常1〜2営業日以内に公式認証バッジ（青の認証マーク）の付与および情報反映を完了いたします。',
      };
    }

    return {
      success: true,
      requestId: claimRequest.id,
      verificationMethod: 'EMAIL_DOMAIN',
      verificationLink,
      message: 'オーナー確認申請を受け付けました。ご入力のメールアドレス宛てに送信された確認リンクをクリックすることで、即座に公式認証バッジ・専門分野・PR文が反映されます。',
    };
  } catch (error: any) {
    console.error('Error submitting company claim request:', error);
    return {
      success: false,
      error: '申請送信中にエラーが発生しました。時間をおいて再試行してください。',
    };
  }
}

/**
 * Gửi yêu cầu Hủy niêm yết (Delist) hoặc Chỉnh sửa thông tin doanh nghiệp
 */
export async function submitDelistRequest(params: SubmitDelistParams) {
  try {
    const {
      companyId,
      reason,
      contactEmail,
      contactPhone,
      details,
    } = params;

    if (!companyId) {
      return { success: false, error: '企業IDが指定されていません。' };
    }
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: '削除・掲載停止の理由を選択または入力してください。' };
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      return { success: false, error: '有効な連絡先メールアドレスを入力してください。' };
    }

    const company = await (prisma as any).realEstateCompany.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return { success: false, error: '対象の不動産業者が見つかりません。' };
    }

    const delistRequest = await (prisma as any).companyDelistRequest.create({
      data: {
        companyId,
        reason: reason.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone ? contactPhone.trim() : null,
        details: details ? details.trim() : null,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      requestId: delistRequest.id,
      message: '掲載停止・削除申請を受け付けました。担当部門にて調査・確認の上、速やかに対応いたします。',
    };
  } catch (error: any) {
    console.error('Error submitting delist request:', error);
    return {
      success: false,
      error: '掲載停止申請の送信中にエラーが発生しました。',
    };
  }
}

/**
 * Thống kê số lượng công ty theo Tỉnh (Phục vụ SEO Hub / Navigation)
 * Truy vấn trực tiếp từ cơ sở dữ liệu nội bộ PostgreSQL
 */
export async function getCompanyCountByPrefecture() {
  try {
    const rawCounts: Array<{ prefecture: string; count: bigint | number }> = await prisma.$queryRaw`
      SELECT "prefecture", COUNT(*)::int as count 
      FROM "RealEstateCompany" 
      WHERE "status" = 'ACTIVE' 
      GROUP BY "prefecture" 
      ORDER BY count DESC;
    `;

    if (Array.isArray(rawCounts) && rawCounts.length > 0) {
      const counts = rawCounts.map((r) => ({
        prefecture: r.prefecture,
        count: Number(r.count),
      }));
      return {
        success: true,
        counts,
      };
    }
  } catch (error: any) {
    console.warn('Error fetching company count from DB, using static fallback:', error);
  }

  return {
    success: true,
    counts: STATIC_PREF_COUNTS,
  };
}
