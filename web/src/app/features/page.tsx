import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Map, LineChart, ShieldAlert, Cpu, TrendingUp, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '主要機能・活用ガイド一覧',
  description: 'Keibai Finderが提供する不動産投資家向けの主要機能一覧。競売物件のマップ検索から、過去10年間の取引価格推移、災害リスクの即時判定まで網羅しています。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/features',
  },
  openGraph: {
    title: '主要機能・活用ガイド一覧｜Keibai Finder',
    description: '競売物件のマップ検索から取引価格推移、災害リスク判定まで不動産投資家向けツール一覧。',
    url: 'https://www.keibai-koubai.com/features',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: 'Keibai Finder 主要機能一覧' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

export default function FeaturesIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.keibai-koubai.com/features#webpage',
        url: 'https://www.keibai-koubai.com/features',
        name: '主要機能・活用ガイド一覧',
        inLanguage: 'ja',
        isPartOf: { '@id': 'https://www.keibai-koubai.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: '主要機能・活用ガイド', item: 'https://www.keibai-koubai.com/features' },
        ],
      },
    ],
  };

  const featureCards = [
    {
      href: '/features/keyword-trends',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60',
      title: '検索需要トレンド分析',
      description: 'Google・Yahoo!の検索需要ボリューム、前月比急上昇率を可視化。利回り20%超の空き家再生や格安戸建てなど市場の注目テーマを即座に特定します。',
      actionText: 'トレンドを分析',
      accentColor: 'text-[#1B4F8A] dark:text-sky-400 group-hover:text-[#143D6C] dark:group-hover:text-sky-300',
    },
    {
      href: '/features/map-search',
      icon: Map,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-sky-400 border border-blue-200/60 dark:border-blue-800/60',
      title: 'エリア物件マップ検索',
      description: '地図上から直感的に競売物件（Keibai）と公売物件（Koubai）を探し出します。学区や駅からの距離など、周辺環境と合わせて投資判断が可能です。',
      actionText: '検索を開始',
      accentColor: 'text-[#1B4F8A] dark:text-sky-400 group-hover:text-[#143D6C] dark:group-hover:text-sky-300',
    },
    {
      href: '/features/trade-price-search',
      icon: LineChart,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
      title: '公的取引相場・価格推移調査',
      description: '国土交通省（MLIT）が公表する過去10年分の不動産取引価格データを視覚化。地域の相場トレンドを一目で把握し、割安な物件を見抜きます。',
      actionText: '相場を調べる',
      accentColor: 'text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300',
    },
    {
      href: '/features/area-map',
      icon: ShieldAlert,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
      title: '重層災害リスクマップ',
      description: '洪水、土砂災害、津波などの各種災害リスクエリアをマップ上に重ねて表示。購入予定物件の安全性を事前に徹底確認できます。',
      actionText: 'リスクを確認',
      accentColor: 'text-amber-700 dark:text-amber-400 group-hover:text-amber-800 dark:group-hover:text-amber-300',
    },
    {
      href: '/extension',
      icon: Cpu,
      iconBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60',
      title: 'Keibai Lens ブラウザ拡張機能',
      description: 'SUUMOやHOME\'Sで家を探す際に、この拡張機能を使えばワンクリックで「公的相場」と「災害リスク」をリアルタイムで照会できます。',
      actionText: '無料でインストール',
      accentColor: 'text-[#1B4F8A] dark:text-sky-400 group-hover:text-[#143D6C] dark:group-hover:text-sky-300',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* 3-Tier Header Banner */}
      <section className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#151B22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumbs */}
          <nav aria-label="パンくずリスト" className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Link href="/" className="hover:text-[#1B4F8A] dark:hover:text-sky-400 transition-colors">
              ホーム
            </Link>
            <span className="mx-1.5 text-slate-400">/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">主要機能・活用ガイド</span>
          </nav>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            主要機能・活用ガイド一覧
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Keibai Finder エコシステムが提供する強力なデータ分析ツール一覧です。目的に合わせたツールを選択し、投資機会を最大化してください。
          </p>
        </div>
      </section>

      {/* Main Grid Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col justify-between bg-white dark:bg-[#151B22] rounded-lg p-5 sm:p-6 border border-slate-200 dark:border-slate-800 hover:border-[#1B4F8A]/50 dark:hover:border-sky-500/50 transition-colors"
              >
                <div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${card.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className={`text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2.5 transition-colors ${card.accentColor}`}>
                    {card.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${card.accentColor}`}>
                    {card.actionText}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
