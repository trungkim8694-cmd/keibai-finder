'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { 
  sendVerifiedAgencyLeadEmail, 
  sendUnverifiedAgencyClaimLeadEmail, 
  sendAdminLeadNotification 
} from '@/lib/emailService';

export interface SubmitLeadParams {
  sale_unit_id?: string;
  agencyProfileId?: string;
  agencyName?: string;
  prefecture?: string;
  broadcastToLocalVerified?: boolean;
  customerName: string;
  contactMethod: 'PHONE' | 'EMAIL' | 'LINE';
  contactValue: string;
  inquiryType: 'BIDDING_ASSIST' | 'RENOVATION' | 'OCCUPANT_NEGOTIATION' | 'GENERAL';
  message?: string;
}

export async function submitAgencyLead(params: SubmitLeadParams) {
  try {
    if (!params.customerName || !params.contactValue) {
      return { success: false, error: 'お名前とお問い合わせ連絡先を入力してください。' };
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // 1. Check target company
    let targetCompany: any = null;
    if (params.agencyProfileId && params.agencyProfileId !== 'general-support') {
      targetCompany = await (prisma as any).realEstateCompany.findUnique({
        where: { id: params.agencyProfileId },
      });

      if (!targetCompany && params.agencyProfileId.startsWith('kigyou_')) {
        const corpNum = params.agencyProfileId.replace(/^kigyou_/, '');
        try {
          const kRes = await fetch(`https://kigyoulist.com/api/external/takken-agencies?keyword=${corpNum}&limit=1`);
          if (kRes.ok) {
            const kData = await kRes.json();
            const ag = kData.agencies?.[0];
            if (ag) {
              targetCompany = await (prisma as any).realEstateCompany.create({
                data: {
                  id: params.agencyProfileId,
                  houjinNumber: ag.corporateNumber || corpNum,
                  companyName: ag.companyName || params.agencyName || '宅建免許保有企業',
                  licenseNumber: ag.licenseNumber || '宅地建物取引業者免許',
                  prefecture: ag.prefecture || params.prefecture || '東京都',
                  city: ag.city || '',
                  address: ag.address || '',
                  phone: ag.phone || null,
                  isVerified: false,
                  isClaimed: false,
                  status: 'ACTIVE',
                },
              });
            }
          }
        } catch (err) {
          console.warn('Failed to auto-import agency from kigyoulist on lead dispatch:', err);
        }
      }
    }

    // 2. Identify target region for broadcast
    const targetPref = targetCompany?.prefecture || params.prefecture || '東京都';
    const cleanPref = targetPref.replace(/(都|府|県)$/, '');

    // 3. Find up to 3 verified companies in the same region for Area Broadcast
    let broadcastCompanies: any[] = [];
    const shouldBroadcast = params.broadcastToLocalVerified !== false || !targetCompany?.isVerified;

    if (shouldBroadcast) {
      broadcastCompanies = await (prisma as any).realEstateCompany.findMany({
        where: {
          status: 'ACTIVE',
          isVerified: true,
          prefecture: { contains: cleanPref },
          id: targetCompany?.id ? { not: targetCompany.id } : undefined,
        },
        take: 3,
        orderBy: { created_at: 'desc' },
      });
    }

    // 4. Automated email notifications via Resend API
    const emailPromises: Promise<any>[] = [];
    const crmDashboardUrl = `${baseUrl}/dashboard?tab=partner-leads`;

    if (targetCompany) {
      if (targetCompany.isVerified && targetCompany.email) {
        console.log(`[LEAD DISPATCH - DIRECT VERIFIED] Sending email to ${targetCompany.companyName} (${targetCompany.email})`);
        emailPromises.push(
          sendVerifiedAgencyLeadEmail({
            agencyEmail: targetCompany.email,
            agencyName: targetCompany.companyName,
            customerName: params.customerName.trim(),
            contactMethod: params.contactMethod,
            contactValue: params.contactValue.trim(),
            inquiryType: params.inquiryType,
            message: params.message,
            saleUnitId: params.sale_unit_id,
            crmDashboardUrl,
          })
        );
      } else if (!targetCompany.isVerified && targetCompany.email) {
        // Generate Claim Invitation Magic Token for Unverified Company
        const claimToken = Buffer.from(JSON.stringify({
          companyId: targetCompany.id,
          email: targetCompany.email,
          createdAt: Date.now(),
          exp: Date.now() + 7 * 24 * 3600 * 1000,
        })).toString('base64url');

        const claimUrl = `${baseUrl}/api/companies/verify-claim?token=${claimToken}&companyId=${targetCompany.id}`;
        console.log(`[LEAD DISPATCH - CLAIM TRIGGER] Sending Magic Claim Invitation to: ${targetCompany.companyName} (${targetCompany.email})`);
        emailPromises.push(
          sendUnverifiedAgencyClaimLeadEmail({
            agencyEmail: targetCompany.email,
            agencyName: targetCompany.companyName,
            customerName: params.customerName.trim(),
            inquiryType: params.inquiryType,
            prefecture: targetPref,
            claimUrl,
          })
        );
      }
    }

    // Broadcast notifications to verified partners in the area
    broadcastCompanies.forEach((comp) => {
      if (comp.email) {
        console.log(`[LEAD DISPATCH - AREA BROADCAST] Sending email to verified partner: ${comp.companyName} (${comp.email})`);
        emailPromises.push(
          sendVerifiedAgencyLeadEmail({
            agencyEmail: comp.email,
            agencyName: comp.companyName,
            customerName: params.customerName.trim(),
            contactMethod: params.contactMethod,
            contactValue: params.contactValue.trim(),
            inquiryType: params.inquiryType,
            message: params.message,
            saleUnitId: params.sale_unit_id,
            crmDashboardUrl,
          })
        );
      }
    });

    // Send platform admin alert
    emailPromises.push(
      sendAdminLeadNotification({
        customerName: params.customerName.trim(),
        contactMethod: params.contactMethod,
        contactValue: params.contactValue.trim(),
        inquiryType: params.inquiryType,
        saleUnitId: params.sale_unit_id,
        message: params.message,
        targetCompanyName: targetCompany?.companyName,
        isVerified: targetCompany?.isVerified,
        broadcastCompanyNames: broadcastCompanies.map((c) => c.companyName),
      })
    );

    // Execute email sends in background without blocking lead registration
    Promise.allSettled(emailPromises).then((results) => {
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          console.warn(`[LEAD EMAIL #${idx}] Delivery failed:`, res.reason);
        }
      });
    });

    // 5. Store lead record
    const dispatchedCompanyIds = [
      targetCompany ? targetCompany.id : null,
      ...broadcastCompanies.map((c) => c.id),
    ].filter(Boolean) as string[];

    const dispatchedList = [
      targetCompany ? `${targetCompany.companyName}（${targetCompany.isVerified ? '指名・公式認証' : '指名・未認証・オーナー確認案内済'}）` : null,
      ...broadcastCompanies.map((c) => `${c.companyName}（${c.prefecture}公式認証パートナー）`),
    ].filter(Boolean);

    const lead = await (prisma as any).agencyLead.create({
      data: {
        sale_unit_id: params.sale_unit_id || null,
        agencyProfileId: params.agencyProfileId || null,
        customerName: params.customerName.trim(),
        contactMethod: params.contactMethod,
        contactValue: params.contactValue.trim(),
        inquiryType: params.inquiryType,
        message: `${params.message ? params.message.trim() + '\n\n' : ''}[自動配信先企業]: ${dispatchedList.join('、')}`,
        dispatchedCompanyIds,
        status: 'NEW',
      },
    });

    if (params.sale_unit_id) {
      revalidatePath(`/property/${params.sale_unit_id}`);
    }
    revalidatePath('/agencies');

    return {
      success: true,
      leadId: lead.id,
      targetCompany: targetCompany
        ? { id: targetCompany.id, name: targetCompany.companyName, isVerified: targetCompany.isVerified }
        : null,
      broadcastCompanies: broadcastCompanies.map((c) => ({
        id: c.id,
        name: c.companyName,
        prefecture: c.prefecture,
      })),
      totalDispatched: (targetCompany ? 1 : 0) + broadcastCompanies.length,
    };
  } catch (error: any) {
    console.error('Error submitting agency lead:', error);
    return { success: false, error: '送信中にエラーが発生しました。時間をおいて再送信してください。' };
  }
}
