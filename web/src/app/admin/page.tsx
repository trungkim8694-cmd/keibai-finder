import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  HomeIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  InboxArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [
    totalProperties,
    totalCompanies,
    verifiedCompanies,
    pendingClaims,
    totalLeads,
    recentClaims,
    recentLeads,
  ] = await Promise.all([
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.realEstateCompany.count(),
    prisma.realEstateCompany.count({ where: { isVerified: true } }),
    prisma.companyClaimRequest.count({ where: { status: "PENDING" } }),
    (prisma as any).agencyLead.count(),
    prisma.companyClaimRequest.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: { company: true },
    }),
    (prisma as any).agencyLead.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          管理システム概要 & KPI
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          全国宅建業者DB、オーナー認証審査、見込み客リード配信、および競売物件稼働状況を一括監視します。
        </p>
      </div>

      {/* Alert Banner if Pending Claims Exist */}
      {pendingClaims > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 tabular-nums">
                未審査のオーナー認証・書類申請が {pendingClaims} 件あります
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                名刺・登記簿謄本を確認し、承認または却下の対応を行ってください。
              </div>
            </div>
          </div>
          <Link
            href="/admin/claims"
            className="min-h-[40px] px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 inline-flex items-center justify-center gap-1.5"
          >
            <span>審査センターを開く</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151B22] p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              認証審査待ち
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingClaims.toLocaleString()} 件
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            要書類審査（名刺・謄本）
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              宅建業者DB
            </span>
            <div className="p-2 bg-[#1B4F8A]/10 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 rounded-lg">
              <BuildingOffice2Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {totalCompanies.toLocaleString()} 社
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 tabular-nums">
            うち公式認証済: {verifiedCompanies.toLocaleString()} 社
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              顧客相談リード
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <InboxArrowDownIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalLeads.toLocaleString()} 件
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            入札代行・明渡し相談
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              稼働中の競売物件
            </span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
              <HomeIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
            {totalProperties.toLocaleString()} 件
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            裁判所公示・BITデータ
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Claims & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
              <span>最新のオーナー認証申請</span>
            </h3>
            <Link
              href="/admin/claims"
              className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline font-semibold"
            >
              すべて見る
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentClaims.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">
                申請履歴はありません
              </div>
            ) : (
              recentClaims.map((claim: any) => (
                <div
                  key={claim.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {claim.company?.companyName || "対象企業"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      申請者: {claim.applicantName} ({claim.applicantEmail})
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        claim.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          : claim.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {claim.status === "PENDING"
                        ? "未審査"
                        : claim.status === "APPROVED"
                        ? "承認済"
                        : "却下"}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 tabular-nums">
                      {new Date(claim.created_at).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <InboxArrowDownIcon className="w-4 h-4 text-emerald-500" />
              <span>最新の顧客相談リード</span>
            </h3>
            <Link
              href="/admin/leads"
              className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline font-semibold"
            >
              すべて見る
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentLeads.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">
                リード履歴はありません
              </div>
            ) : (
              recentLeads.map((lead: any) => (
                <div
                  key={lead.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {lead.customerName} 様 ({lead.inquiryType || "入札相談"})
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                      {lead.contactMethod}: {lead.contactValue}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
                      {lead.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 tabular-nums">
                      {new Date(lead.created_at).toLocaleDateString("ja-JP")}
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
