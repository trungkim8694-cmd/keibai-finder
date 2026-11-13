import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, Bot, ShieldCheck, ArrowLeft } from 'lucide-react';
import { getTrendingKeywords, getMacroTrendStats } from '@/lib/keibaiTrendEngine';
import KeywordTrendsClient from './KeywordTrendsClient';

export const revalidate = 3600; // Cập nhật định kỳ mỗi 1 giờ

export const metadata: Metadata = {
  title: '【2026年最新】不動産競売・公売 検索需要トレンド・急上昇キーワード分析ツール｜Keibai Finder',
  description: '裁判所競売および国税庁公売における検索キーワード需要のリアルタイム分析。格安エリア、利回り20%超の再建築不可物件、3点セットの読み方から占有者立ち退きまで、AI Agentと連動した最新トレンドを網羅。',
  alternates: {
    canonical: '/features/keyword-trends',
  },
  openGraph: {
    title: '不動産競売 検索需要・急上昇キーワード分析ツール｜Keibai Finder',
    description: '市場の検索ボリュームと急上昇率を可視化。AI Agentと連動した競売投資インサイト。',
    type: 'website',
  }
};

export default async function KeywordTrendsPage() {
  const [initialKeywords, stats] = await Promise.all([
    getTrendingKeywords({ limit: 50, sortBy: 'growth' }),
    Promise.resolve(getMacroTrendStats())
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DataFeed',
    name: '日本不動産競売 検索需要・急上昇キーワード動向',
    description: '裁判所競売・公売市場における検索ボリューム・トレンド成長率・投資意図のデータフィード。',
    provider: {
      '@type': 'Organization',
      name: 'Keibai Finder',
      url: 'https://www.keibai-koubai.com'
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 py-8 sm:py-12 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline text-slate-600 dark:text-slate-400">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold">
            競売検索トレンド・キーワード分析
          </span>
        </div>

        {/* Header Section: Chuẩn Japanese B2B Minimalist */}
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-sky-950 dark:text-sky-300 border border-[#1B4F8A]/20">
              <Bot className="w-3.5 h-3.5" />
              AI Agent 連携エンジン
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              リアルタイム市場需要トラッキング中
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            不動産競売・公売 検索需要トレンド分析
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Google・Yahoo! Japanにおける不動産競売・公売関連の検索需要ボリューム、前月比伸長率、および投資家の関心事項を網羅的に解析。
            急増する市場ニーズを捉え、AI AgentによるSEOコンテンツ自動生成や割安物件の先行選定に活用できます。
          </p>
        </div>

        {/* Client Interactive Workspace */}
        <KeywordTrendsClient initialKeywords={initialKeywords} stats={stats} />

        {/* Footnote & B2B Usage Guidance */}
        <div className="p-4 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400" />
            <span>データ集計方針およびAI Agent統合について</span>
          </p>
          <p>
            ※ 本ツールで表示される検索ボリュームおよび推移指数は、国内主要検索エンジンの検索ログおよび関連キーワードAPIを基に統計処理した推計値です。
          </p>
          <p>
            ※ 「AI Agent 連携」機能は、急上昇キーワードをフックとしてブログ記事（DailyDigest）や地域別Programmatic Landing Pageの自動構成案を即座に生成し、SEO集客の自動化を実現します。
          </p>
        </div>

      </div>
    </div>
  );
}
