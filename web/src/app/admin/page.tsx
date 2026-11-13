import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  UsersIcon, 
  HomeIcon, 
  CalendarIcon, 
  BuildingOffice2Icon,
  ShieldCheckIcon,
  InboxArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalProperties,
    totalCompanies,
    verifiedCompanies,
    pendingClaims,
    totalLeads,
    recentClaims,
    recentLeads
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.realEstateCompany.count(),
    prisma.realEstateCompany.count({ where: { isVerified: true } }),
    prisma.companyClaimRequest.count({ where: { status: 'PENDING' } }),
    (prisma as any).agencyLead.count(),
    prisma.companyClaimRequest.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { company: true }
    }),
    (prisma as any).agencyLead.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    })
  ]);

  return (
    <div className="space-y-8 font-sans max-w-7xl">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">管理システム概要 & KPI</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          全国宅建業者DB、オーナー認証審査、見込み客リード配信、および競売物件稼働状況を一括監視します。
        </p>
      </div>

      {/* Alert Banner if Pending Claims Exist */}
      {pendingClaims > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                未審査のオーナー認証・書類申請が {pendingClaims} 件あります
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                名刺・登記簿謄本を確認し、承認または却下の対応を行ってください。
              </div>
            </div>
          </div>
          <Link
            href="/admin/claims"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1"
          >
            <span>審査センターを開く</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pending Claims */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-2xs border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">認証審査待ち</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingClaims} 件</div>
          <div className="text-[11px] text-zinc-400 mt-1">要書類審査（名刺・謄本）</div>
        </div>

        {/* Card 2: Takken Companies */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-2xs border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">宅建業者DB</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <BuildingOffice2Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{totalCompanies.toLocaleString()} 社</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            うち公式認証済: {verifiedCompanies} 社
          </div>
        </div>

        {/* Card 3: Agency Leads */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-2xs border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">顧客相談リード</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <InboxArrowDownIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalLeads.toLocaleString()} 件</div>
          <div className="text-[11px] text-zinc-400 mt-1">入札代行・明渡し相談</div>
        </div>

        {/* Card 4: Properties */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-2xs border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500">稼働中の競売物件</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
              <HomeIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600">{totalProperties.toLocaleString()} 件</div>
          <div className="text-[11px] text-zinc-400 mt-1">裁判所公示・BITデータ</div>
        </div>
      </div>

      {/* Two Column Section: Recent Claims & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Claims */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
              <span>最新のオーナー認証申請</span>
            </h3>
            <Link href="/admin/claims" className="text-xs text-blue-600 hover:underline font-bold">
              すべて見る ↗
            </Link>
          </div>

          <div className="space-y-3">
            {recentClaims.length === 0 ? (
              <div className="text-xs text-zinc-400 py-6 text-center">申請履歴はありません</div>
            ) : (
              recentClaims.map((claim: any) => (
                <div key={claim.id} className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-xs flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {claim.company?.companyName || '対象企業'}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      申請者: {claim.applicantName} ({claim.applicantEmail})
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      claim.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {claim.status === 'PENDING' ? '未審査' : claim.status === 'APPROVED' ? '承認済' : '却下'}
                    </span>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      {new Date(claim.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Leads */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <InboxArrowDownIcon className="w-4 h-4 text-emerald-500" />
              <span>最新の顧客相談リード</span>
            </h3>
            <Link href="/admin/leads" className="text-xs text-blue-600 hover:underline font-bold">
              すべて見る ↗
            </Link>
          </div>

          <div className="space-y-3">
            {recentLeads.length === 0 ? (
              <div className="text-xs text-zinc-400 py-6 text-center">リード履歴はありません</div>
            ) : (
              recentLeads.map((lead: any) => (
                <div key={lead.id} className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-xs flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {lead.customerName} 様 ({lead.inquiryType || '入札相談'})
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {lead.contactMethod}: {lead.contactValue}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {lead.status}
                    </span>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      {new Date(lead.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
