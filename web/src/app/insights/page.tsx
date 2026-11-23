import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { Calendar, Tag, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '本日の注目案件・市場分析レポート一覧',
  description: '最新の不動産競売・公売市場トレンドと割安物件を公的相場データから分析。相場乖離率の高い注目割安案件を毎日ピックアップ。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/insights',
  },
  openGraph: {
    title: '本日の注目案件・市場分析レポート一覧｜Keibai Finder',
    description: '最新の不動産競売・公売市場トレンドと注目割安案件の分析レポート。',
    url: 'https://www.keibai-koubai.com/insights',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: '本日の注目案件レポート' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

// Next.js 15: async Server Component
export const revalidate = 600; // Auto update every 10 minutes

export default async function InsightsHubPage() {
  // Fetch from DB
  const digests = await prisma.dailyDigest.findMany({
    where: {
      category: 'MARKET_REPORT'
    },
    orderBy: { publishDate: 'desc' },
    take: 50,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.keibai-koubai.com/insights#webpage',
        url: 'https://www.keibai-koubai.com/insights',
        name: '本日の注目案件・市場分析レポート一覧',
        inLanguage: 'ja',
        isPartOf: { '@id': 'https://www.keibai-koubai.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: '本日の注目案件レポート', item: 'https://www.keibai-koubai.com/insights' },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      
      {/* 3-Tier Header Banner */}
      <section className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#151B22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <nav aria-label="パンくずリスト" className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Link href="/" className="hover:text-[#1B4F8A] dark:hover:text-sky-400 transition-colors">
              ホーム
            </Link>
            <span className="mx-1.5 text-slate-400">/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">市場分析レポート</span>
          </nav>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            本日の注目案件・市場分析レポート
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            価格乖離（マージン）20%以上の注目割安案件をピックアップ。公的取引相場データに基づき、プロの投資家視点で市場の歪みと投資機会をお届けします。
          </p>
        </div>
      </section>

      {/* Main Grid / List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {digests.length === 0 ? (
          <div className="text-center p-8 sm:p-12 bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-slate-800">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">現在、公開されているレポートはありません。</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            {digests.map((digest) => (
              <Link 
                href={`/insights/${digest.slug}`} 
                key={digest.id}
                className="group block bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 hover:border-[#1B4F8A]/50 dark:hover:border-sky-500/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md tabular-nums font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(digest.publishDate).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                      </span>
                      {digest.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs font-medium text-[#1B4F8A] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] dark:group-hover:text-sky-400 transition-colors truncate">
                      {digest.title_ja || "本日の市場分析レポート"}
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                       {/* Strip markdown # and * for preview snippet */}
                       {digest.content_ja.replace(/[#*]/g, '').substring(0, 150)}...
                    </p>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-[#1B4F8A] group-hover:text-white dark:group-hover:bg-sky-500 text-slate-400 transition-colors self-end sm:self-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
