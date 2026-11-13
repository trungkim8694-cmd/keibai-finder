'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUserFavorites(userId: string) {
  if (!userId) return [];
  
  const favorites = await (prisma as any).favorite.findMany({
    where: { userId },
    orderBy: { created_at: 'desc' }
  });

  const propertyIds = favorites.map((f: any) => f.sale_unit_id);
  
  if (propertyIds.length === 0) return [];

  const [properties, memos] = await Promise.all([
    prisma.property.findMany({
      where: { sale_unit_id: { in: propertyIds } },
      include: {
        auction_events: true,
        auction_history: true
      }
    }),
    prisma.userMemo.findMany({
      where: { userId, sale_unit_id: { in: propertyIds } }
    })
  ]);

  return propertyIds.map((id: string) => {
    const p = properties.find(prop => prop.sale_unit_id === id) || null;
    const fav = favorites.find((f: any) => f.sale_unit_id === id);
    const memo = memos.find(m => m.sale_unit_id === id)?.content || '';

    let sanitizedProperty = p as any;
    if (p) {
      sanitizedProperty = JSON.parse(JSON.stringify(p, (k, v) => typeof v === 'bigint' ? Number(v) : v));
      
      const rawImages = sanitizedProperty.images || [];
      const mappedImages = rawImages.map((img: string) => 
          img.startsWith('./') ? `https://www.koubai.nta.go.jp/auctionx/public${img.substring(1)}` : img
      );

      const isPermanent = (url: string) => Boolean(url && (url.includes('r2.dev') || url.includes('supabase.co')));
      const sortedImages = [...mappedImages].sort((a, b) => {
          const aPerm = isPermanent(a);
          const bPerm = isPermanent(b);
          if (aPerm && !bPerm) return -1;
          if (!aPerm && bPerm) return 1;
          return 0;
      });
      sanitizedProperty.images = sortedImages;

      const permanentImage = sortedImages.find(isPermanent);
      const mappedThumbnail = permanentImage
        ? permanentImage
        : (sanitizedProperty.source_provider === 'NTA' && sortedImages.length > 0
            ? sortedImages[0]
            : (sanitizedProperty.thumbnailUrl 
                ? sanitizedProperty.thumbnailUrl.replace('bit.sikkou.jp', 'www.bit.courts.go.jp') 
                : (sortedImages.length > 0 ? sortedImages[0] : null)));
      sanitizedProperty.thumbnailUrl = mappedThumbnail;

      if (!sanitizedProperty.contact_url && sanitizedProperty.raw_display_data) {
        if (sanitizedProperty.source_provider === 'NTA') {
            sanitizedProperty.contact_url = sanitizedProperty.raw_display_data.nta_map_link || null;
        } else {
            const arr = Array.isArray(sanitizedProperty.raw_display_data) ? sanitizedProperty.raw_display_data : null;
            if (arr) {
               const summary = arr.find((s: any) => s?.asset_title === 'Summary');
               sanitizedProperty.contact_url = summary?.contact_url || null;
            }
        }
      }
    }

    return {
      propertyId: id,
      property: sanitizedProperty,
      stage: fav?.stage || 'CONSIDERING',
      memo,
      favoritedAt: fav?.created_at
    };
  });
}

export async function updateFavoriteStage(userId: string, sale_unit_id: string, stage: string) {
  if (!userId || !sale_unit_id) return { success: false };
  try {
    await (prisma as any).favorite.update({
      where: {
        userId_sale_unit_id: { userId, sale_unit_id }
      },
      data: { stage }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update favorite stage:', error);
    return { success: false, error: '更新に失敗しました' };
  }
}

export async function saveUserMemo(userId: string, sale_unit_id: string, content: string) {
  if (!userId || !sale_unit_id) return { success: false };
  try {
    await prisma.userMemo.upsert({
      where: {
        userId_sale_unit_id: { userId, sale_unit_id }
      },
      create: {
        userId,
        sale_unit_id,
        content: content.trim()
      },
      update: {
        content: content.trim()
      }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save memo:', error);
    return { success: false, error: '保存に失敗しました' };
  }
}

export async function removeFavorite(userId: string, sale_unit_id: string) {
  if (!userId || !sale_unit_id) return { success: false };
  try {
    await (prisma as any).favorite.delete({
      where: {
        userId_sale_unit_id: { userId, sale_unit_id }
      }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return { success: false, error: '削除に失敗しました' };
  }
}

export async function addFavorite(userId: string, sale_unit_id: string) {
  if (!userId || !sale_unit_id) return { success: false };
  try {
    const count = await (prisma as any).favorite.count({ where: { userId } });
    if (count >= 50) {
      return { success: false, error: 'LIMIT_REACHED' };
    }

    await (prisma as any).favorite.create({
      data: {
        userId,
        sale_unit_id,
        stage: 'CONSIDERING'
      }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    if (error?.code === 'P2002') return { success: true };
    console.error('Failed to add favorite:', error);
    return { success: false, error: '登録に失敗しました' };
  }
}

export async function getUserLeads(email: string) {
  if (!email) return [];
  try {
    const leads = await (prisma as any).agencyLead.findMany({
      where: {
        OR: [
          { contactValue: email },
          { message: { contains: email } }
        ]
      },
      orderBy: { created_at: 'desc' }
    });
    return JSON.parse(JSON.stringify(leads));
  } catch (error) {
    console.error('Failed to get user leads:', error);
    return [];
  }
}

export async function getUserClaimedCompanies(userId: string, email: string) {
  if (!userId && !email) return [];
  try {
    const companies = await prisma.realEstateCompany.findMany({
      where: {
        OR: [
          { claimedUserId: userId },
          { email: email }
        ]
      },
      orderBy: { updated_at: 'desc' }
    });
    return JSON.parse(JSON.stringify(companies));
  } catch (error) {
    console.error('Failed to get user claimed companies:', error);
    return [];
  }
}

export async function getUserClaimRequests(userId: string, email: string) {
  if (!userId && !email) return [];
  try {
    const requests = await prisma.companyClaimRequest.findMany({
      where: {
        OR: [
          { userId },
          { applicantEmail: email }
        ]
      },
      include: {
        company: true
      },
      orderBy: { created_at: 'desc' }
    });
    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    console.error('Failed to get user claim requests:', error);
    return [];
  }
}

export async function getPartnerIncomingLeads(companyIds: string[]) {
  if (!companyIds || companyIds.length === 0) return [];
  try {
    const leads = await (prisma as any).agencyLead.findMany({
      where: {
        OR: [
          { dispatchedCompanyIds: { hasSome: companyIds } },
          { agencyProfileId: { in: companyIds } }
        ]
      },
      orderBy: { created_at: 'desc' }
    });
    return JSON.parse(JSON.stringify(leads));
  } catch (error) {
    console.error('Failed to get partner leads:', error);
    return [];
  }
}

export async function updateClaimedCompanyProfile(
  companyId: string, 
  userId: string, 
  data: { 
    specialties?: string[]; 
    description?: string; 
    phone?: string; 
    email?: string; 
    website?: string 
  }
) {
  if (!companyId || !userId) return { success: false, error: '認証情報が不足しています' };

  try {
    const company = await prisma.realEstateCompany.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return { success: false, error: '会社情報が見つかりません' };
    }

    // Check ownership or admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isOwner = company.claimedUserId === userId || (user?.email && company.email === user.email);
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return { success: false, error: '編集権限がありません' };
    }

    // Validation description limit 200 chars
    const description = (data.description || '').trim();
    if (description.length > 200) {
      return { success: false, error: 'PR・会社紹介文は200文字以内で入力してください' };
    }

    const updated = await prisma.realEstateCompany.update({
      where: { id: companyId },
      data: {
        specialties: data.specialties ?? company.specialties,
        description: description || company.description,
        phone: data.phone !== undefined ? data.phone.trim() : company.phone,
        email: data.email !== undefined ? data.email.trim() : company.email,
        website: data.website !== undefined ? data.website.trim() : company.website,
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/agencies');

    return { success: true, company: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('Failed to update company profile:', error);
    return { success: false, error: 'プロフィールの更新に失敗しました' };
  }
}

export async function updatePartnerLeadStatus(
  leadId: string, 
  status: string, 
  partnerNotes?: string
) {
  if (!leadId) return { success: false, error: 'リードIDが不足しています' };

  try {
    const updated = await (prisma as any).agencyLead.update({
      where: { id: leadId },
      data: {
        status,
        partnerNotes: partnerNotes !== undefined ? partnerNotes : undefined,
      }
    });

    revalidatePath('/dashboard');
    return { success: true, lead: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('Failed to update lead status:', error);
    return { success: false, error: '更新に失敗しました' };
  }
}

export async function updateUserAccountProfile(userId: string, data: { name?: string }) {
  if (!userId) return { success: false };
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name?.trim() || undefined
      }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    return { success: false, error: 'ユーザー情報の更新に失敗しました' };
  }
}
