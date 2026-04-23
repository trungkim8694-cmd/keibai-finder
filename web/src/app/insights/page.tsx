import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { Calendar, Tag, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '市場分析ダッシュボード | Deal Hời Hôm Nay',
  description: 'AIが分析する最新の不動産競売・公売市場トレンドと掘り出し物物件。',
};

// Next.js 15: async Server Component
export const revalidate = 600; // Auto update every 10 minutes

export default async function InsightsHubPage() {
  // Fetch from DB
  const digests = await prisma.dailyDigest.findMany({
    orderBy: { publishDate: 'desc' },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="space-y-4 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-500 rounded-full text-sm font-bold tracking-wide">
            <span>⚡</span>
            DAILY MARKET DEALS
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            市場分析<span className="text-blue-600 dark:text-blue-500">ダッシュボード</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            価格乖離（マージン）20%以上の激アツ物件をピックアップ。 プロの投資家が見ている市場の歪みをお届けします。
          </p>
        </header>

        {digests.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">現在、公開されているレポートはありません。</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {digests.map((digest) => (
              <Link 
                href={`/insights/${digest.slug}`} 
                key={digest.id}
                className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(digest.publishDate).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                      </span>
                      {digest.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {digest.title_ja || "本日の市場分析レポート"}
                    </h2>
                    
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                       {/* Strip markdown # and * for preview snippet */}
                       {digest.content_ja.replace(/[#*]/g, '').substring(0, 150)}...
                    </p>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 group-hover:bg-blue-600 group-hover:text-white transition-colors text-zinc-400">
                    <ChevronRight className="w-5 h-5" />
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
