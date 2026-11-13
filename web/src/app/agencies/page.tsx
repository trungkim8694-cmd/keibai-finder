import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getRealEstateCompanies, getCompanyCountByPrefecture } from '@/actions/companyActions';
import { AgenciesDirectoryClient } from '@/components/Agency/AgenciesDirectoryClient';
import { Building2, ChevronRight, Home, ShieldCheck } from 'lucide-react';

export const revalidate = 60; // Dynamic revalidation every 60s

export const metadata: Metadata = {
  title: '全国不動産会社データベース（宅建免許保有企業）｜keibai-koubai.com',
  description: '国土交通省・自治体公開の宅地建物取引業者名簿および法人番号データに基づく全国の不動産会社データベース。競売入札代行、明渡し交渉、任意売却、物件調査に対応した免許保有企業を検索できます。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/agencies',
  },
  openGraph: {
    title: '全国不動産会社データベース（宅建免許保有企業）｜keibai-koubai.com',
    description: '国土交通省・自治体公開の宅地建物取引業者名簿および法人番号データに基づく全国の不動産会社データベース。競売入札代行、明渡し交渉、任意売却に対応した免許保有企業を検索できます。',
    url: 'https://www.keibai-koubai.com/agencies',
    type: 'website',
  },
};

function deepSerialize(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'bigint') return Number(data);
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) return data.map(deepSerialize);
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      serialized[key] = deepSerialize(data[key]);
    }
    return serialized;
  }
  return data;
}

export default async function AgenciesPage() {
  const [companiesResult, countsResult] = await Promise.all([
    getRealEstateCompanies({ page: 1, limit: 60 }),
    getCompanyCountByPrefecture(),
  ]);

  const safeCompanies = deepSerialize(companiesResult.companies || []);
  const safeCounts = deepSerialize(countsResult.counts || []);
  const initialTotal = companiesResult.total || 26035;

  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.keibai-koubai.com';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: `${baseUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '全国不動産会社データベース',
        item: `${baseUrl}/agencies`,
      },
    ],
  };

  const directoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '全国不動産会社データベース（宅建免許保有企業）',
    description: '国土交通省・自治体公開の宅地建物取引業者名簿および法人番号データに基づく全国の不動産会社データベース。',
    url: `${baseUrl}/agencies`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryJsonLd) }}
      />

      <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans pb-20">
        {/* SUBHEADER BREADCRUMB BAR */}
        <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500">
              <Link href="/" className="hover:text-blue-700 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>ホーム</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 font-medium">不動産会社を探す（宅建DB）</span>
            </nav>
          </div>
        </div>

        {/* HERO TITLE SECTION - 1280px standard container */}
        <section className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>宅地建物取引業者名簿・国税庁法人番号公的データ準拠</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              全国不動産会社データベース（宅建免許保有企業）
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-4xl leading-relaxed">
              公的登記及び宅建免許情報に基づく全国の不動産会社一覧です。裁判所競売物件・公売物件の入札代行、占有者との明渡し交渉、現地調査、不動産売買・リフォームまで、各地域で相談可能な専門会社を検索いただけます。
            </p>
          </div>
        </section>

        {/* MAIN DIRECTORY CONTENT - 1280px standard container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <AgenciesDirectoryClient 
            initialCompanies={safeCompanies} 
            prefectureCounts={safeCounts}
            initialTotal={initialTotal}
          />
        </main>
      </div>
    </>
  );
}
