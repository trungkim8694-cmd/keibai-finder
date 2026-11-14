import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  MapPin,
  Train,
  Search,
  Building2,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
  Coins,
  Flame,
  ArrowRight,
  Database,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { getProperties } from '@/actions/propertyActions';
import type { SharedProperty } from '@/types';
import HomeSmartSearch from '@/components/HomeSmartSearch';
import HomeMapPreview from '@/components/HomeMapPreview';

export const revalidate = 1800; // Cache 30 minutes for fast SSR

export const metadata: Metadata = {
  title: {
    absolute: '全国の競売物件・公売物件一括検索＆相場分析ポータル｜Keibai Finder',
  },
  description:
    '全国の地方裁判所（BIT）および税務署（国税庁公売）で公示された競売・公売物件を一括横断検索。47都道府県・主要沿線・予算別のデータハブや、地図検索、国土交通省の取引相場データに基づく割安物件リサーチを提供します。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com',
  },
  openGraph: {
    title: '全国の競売物件・公売物件一括検索＆相場分析ポータル｜Keibai Finder',
    description:
      '市場価格より割安な不動産を見つける。全国の競売・公売物件を都道府県・沿線・価格帯・地図から横断検索。',
    url: 'https://www.keibai-koubai.com',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/keibaikoubai.webp',
        width: 1200,
        height: 630,
        alt: 'Keibai Finder - 全国の競売物件・公売物件一括検索＆相場分析ポータル',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '全国の競売物件・公売物件一括検索＆相場分析ポータル｜Keibai Finder',
    description:
      '全国の地方裁判所（BIT）・国税局の競売・公売物件を一括検索。国土交通省の成約相場データ連携で割安物件を発掘。',
    images: ['/keibaikoubai.webp'],
  },
};

// 7 Regions and 47 Prefectures
const REGIONS = [
  {
    name: '北海道・東北',
    prefectures: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  },
  {
    name: '関東',
    prefectures: ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'],
  },
  {
    name: '中部・北陸',
    prefectures: ['愛知県', '静岡県', '岐阜県', '三重県', '新潟県', '長野県', '山梨県', '富山県', '石川県', '福井県'],
  },
  {
    name: '近畿',
    prefectures: ['大阪府', '兵庫県', '京都府', '滋賀県', '奈良県', '和歌山県'],
  },
  {
    name: '中国・四国',
    prefectures: ['広島県', '岡山県', '山口県', '鳥取県', '島根県', '香川県', '愛媛県', '徳島県', '高知県'],
  },
  {
    name: '九州・沖縄',
    prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
  },
];

// Popular Railway Lines
const POPULAR_LINES = [
  { name: 'JR山手線', pref: '東京都' },
  { name: 'JR中央線', pref: '東京都' },
  { name: 'JR総武線', pref: '東京都' },
  { name: 'JR京浜東北線', pref: '東京都' },
  { name: 'JR東海道本線', pref: '神奈川県' },
  { name: '東京メトロ丸ノ内線', pref: '東京都' },
  { name: '東急東横線', pref: '東京都' },
  { name: '小田急小田原線', pref: '東京都' },
  { name: 'JR大阪環状線', pref: '大阪府' },
  { name: '阪急神戸本線', pref: '兵庫県' },
  { name: '名鉄名古屋本線', pref: '愛知県' },
  { name: '福岡市営空港線', pref: '福岡県' },
];

export default async function HomePage() {
  // Fetch aggregate data server-side
  const [
    totalActiveCount,
    prefCountsRaw,
    typeCountsRaw,
    latestProperties,
    recentAuctionResults,
    mapPropertiesRaw,
  ] = await Promise.all([
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.property.groupBy({
      by: ['prefecture'],
      _count: { sale_unit_id: true },
      where: { status: 'ACTIVE' },
    }),
    prisma.property.groupBy({
      by: ['property_type'],
      _count: { sale_unit_id: true },
      where: { status: 'ACTIVE' },
    }),
    getProperties({ limit: 12, sort: 'newest' }),
    prisma.auctionResult.findMany({
      orderBy: { completionDate: 'desc' },
      take: 4,
    }),
    prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        lat: { not: null },
        lng: { not: null },
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 300,
      select: {
        sale_unit_id: true,
        lat: true,
        lng: true,
        property_type: true,
        starting_price: true,
        address: true,
        court_name: true,
        source_provider: true,
        mlit_investment_gap: true,
      },
    }),
  ]);

  // Map prefecture counts
  const prefCountMap: Record<string, number> = {};
  prefCountsRaw.forEach((p) => {
    if (p.prefecture) {
      prefCountMap[p.prefecture] = p._count.sale_unit_id;
    }
  });

  // Map property type counts
  const typeCountMap: Record<string, number> = {};
  typeCountsRaw.forEach((t) => {
    if (t.property_type) {
      typeCountMap[t.property_type] = t._count.sale_unit_id;
    }
  });

  const serializedProperties: SharedProperty[] = (latestProperties as any[]) || [];

  // Safely serialize map properties (converting BigInt starting_price to Number)
  const previewProperties = mapPropertiesRaw.map((p) => ({
    sale_unit_id: p.sale_unit_id,
    lat: p.lat as number,
    lng: p.lng as number,
    property_type: p.property_type,
    starting_price: p.starting_price ? Number(p.starting_price) : null,
    address: p.address,
    court_name: p.court_name,
    source_provider: p.source_provider,
    mlit_investment_gap: p.mlit_investment_gap,
  }));

  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.keibai-koubai.com/#webpage',
        url: 'https://www.keibai-koubai.com',
        name: '全国の競売物件・公売物件一括検索＆相場分析ポータル｜Keibai Finder',
        description:
          '全国の地方裁判所（BIT）および税務署（国税庁公売）で公示された競売・公売物件を一括横断検索。国土交通省の取引相場データに基づく割安物件リサーチを提供。',
        inLanguage: 'ja',
        isPartOf: {
          '@id': 'https://www.keibai-koubai.com/#website',
        },
        about: {
          '@id': 'https://www.keibai-koubai.com/#dataset',
        },
        mainEntity: {
          '@id': 'https://www.keibai-koubai.com/#latest-properties',
        },
      },
      {
        '@type': 'Dataset',
        '@id': 'https://www.keibai-koubai.com/#dataset',
        name: '全国不動産競売（BIT）・公売物件・落札結果および国土交通省取引相場統合データベース',
        description: `日本全国の地方裁判所（BIT）の競売物件、国税局・税務署の公売物件（現在公示中 ${totalActiveCount} 件）、過去の落札結果データ、および国土交通省不動産情報ライブラリ（MLIT）の成約価格を統合・分析した不動産データセット。`,
        url: 'https://www.keibai-koubai.com',
        inLanguage: 'ja',
        isAccessibleForFree: true,
        creator: {
          '@id': 'https://www.keibai-koubai.com/#organization',
        },
        keywords: [
          '競売物件',
          '公売物件',
          'BIT 不動産競売',
          '官公庁オークション',
          '落札結果',
          '売却基準価額',
          '不動産取引価格情報',
        ],
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.keibai-koubai.com/#latest-properties',
        name: '新着競売・公売物件速報（最新12件）',
        numberOfItems: serializedProperties.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: serializedProperties.slice(0, 12).map((prop, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'RealEstateListing',
            '@id': `https://www.keibai-koubai.com/property/${prop.sale_unit_id}`,
            url: `https://www.keibai-koubai.com/property/${prop.sale_unit_id}`,
            name: `${prop.address || prop.prefecture || '全国'}の${prop.property_type || '不動産'}（${prop.source_provider === 'NTA' ? '公売物件' : '競売物件'}）`,
            ...(prop.starting_price
              ? {
                offers: {
                  '@type': 'Offer',
                  price: Number(prop.starting_price),
                  priceCurrency: 'JPY',
                  availability: 'https://schema.org/InStock',
                },
              }
              : {}),
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      {/* 1. HERO SECTION (Minimalist Japanese B2B) */}
      <section className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>現在公示中の物件数:</span>
            <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
              {totalActiveCount.toLocaleString()} 件
            </strong>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            全国の競売物件・公売物件を一括検索
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            裁判所の競売（BIT）と税務署の公売（国税局）を網羅。市場相場データ・利回り試算・AI価格査定で割安な不動産投資をサポートします。
          </p>

          {/* Unified Smart Search Bar & Quick Filter Chips */}
          <HomeSmartSearch prefCountMap={prefCountMap} />
        </div>
      </section>

      {/* MAIN CONTAINER: Standardized 1280px (max-w-7xl) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        {/* INTERACTIVE MINI-MAP PREVIEW (Visual Discovery Hub) */}
        <HomeMapPreview properties={previewProperties} />
        {/* CORE VALUATION & DX TOOLS SHOWCASE */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/90 dark:border-zinc-800 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                実務相場・分析ツール（4大DX機能）
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">データに基づく合理的な不動産調査・価格検証</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
            {/* 1. 落札結果データベース */}
            <Link
              href="/auction-results"
              className="p-4 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#1B4F8A] dark:text-blue-300">4,100件+</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] transition-colors">
                  落札結果データベース
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  過去の競売・公売落札価額と入札倍率を網羅。適正入札価格の査定に。
                </p>
              </div>
              <span className="text-xs text-[#1B4F8A] dark:text-blue-400 font-semibold inline-flex items-center gap-1 pt-3">
                <span>落札データを調べる</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* 2. 不動産取引価格検索 (国交省公式) */}
            <Link
              href="/trade-find"
              className="p-4 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">国交省公式</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] transition-colors">
                  不動産取引価格検索
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  国土交通省の成約事例（平米単価・築年数）を照会して割高物件を回避。
                </p>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold inline-flex items-center gap-1 pt-3">
                <span>実勢取引相場を検索</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* 3. 市場分析ダッシュボード (需給分析) */}
            <Link
              href="/market-insights"
              className="p-4 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">需給分析</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] transition-colors">
                  市場分析ダッシュボード
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  都道府県別の平均売却価額、高利回りエリア、競合状況をチャート可視化。
                </p>
              </div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 pt-3">
                <span>需給チャートを見る</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* 4. Keibai Lens 拡張機能 (Chrome拡張) */}
            <Link
              href="/extension"
              className="p-4 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-2xs">
                    <img
                      src="/extension-icon.png"
                      alt="Keibai Lens Chrome拡張機能アイコン"
                      width={32}
                      height={32}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">Chrome拡張</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] transition-colors">
                  Keibai Lens 拡張機能
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  SUUMOやBITを閲覧中、ワンクリックで相場乖離とハザードリスクをX線表示。
                </p>
              </div>
              <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold inline-flex items-center gap-1 pt-3">
                <span>拡張機能を見る（無料）</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </section>
        {/* 2. REGION & PREFECTURE DATA HUB (47 都道府県) */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-6 shadow-none">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                都道府県から競売・公売物件を探す
              </h2>
            </div>
            <Link
              href="/search/area"
              className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>全国47都道府県一覧</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-6 space-y-6">
            {REGIONS.map((region) => (
              <div key={region.name} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 text-xs">
                <span className="w-24 shrink-0 font-semibold text-slate-700 dark:text-slate-300 py-1">
                  {region.name}
                </span>
                <div className="flex-1 flex flex-wrap gap-2">
                  {region.prefectures.map((pref) => {
                    const count = prefCountMap[pref] || 0;
                    return (
                      <Link
                        key={pref}
                        href={`/search/area/${encodeURIComponent(pref)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 hover:border-[#1B4F8A] transition-colors"
                      >
                        <span className="text-slate-700 dark:text-slate-300">{pref}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums font-medium">
                          ({count})
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. INVESTMENT SIGNALS & SPECIAL FILTERS */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-6 shadow-none">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                こだわり条件・投資シグナルから探す
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">市場分析シグナル</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-xs">
            <Link
              href="/map?maxPrice=3000000"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>300万円以下の物件</span>
              </div>
              <p className="text-[11px] text-slate-400">少額から始められる投資・再生用物件</p>
            </Link>

            <Link
              href="/map?maxPrice=10000000"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>1,000万円以下</span>
              </div>
              <p className="text-[11px] text-slate-400">居住用・実需向け戸建て＆マンション</p>
            </Link>

            <Link
              href="/map?minGap=30"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>相場比+30%超 割安物件</span>
              </div>
              <p className="text-[11px] text-slate-400">国土交通省相場との価格乖離が大きい物件</p>
            </Link>

            <Link
              href="/map?isClosingSoon=true"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-red-600" />
                <span>入札締切間近 (48時間以内)</span>
              </div>
              <p className="text-[11px] text-slate-400">今週開札・入札期限が迫っている物件</p>
            </Link>

            <Link
              href="/map?provider=NTA"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
                <span>公売物件（国税局・税務署）</span>
              </div>
              <p className="text-[11px] text-slate-400">差押財産の公売・インターネット公売</p>
            </Link>

            <Link
              href="/map?provider=BIT"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <Building2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span>競売物件（地方裁判所）</span>
              </div>
              <p className="text-[11px] text-slate-400">裁判所の3点セット公示物件</p>
            </Link>

            <Link
              href="/map?types[]=戸建て"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <span>一戸建て物件</span>
              </div>
              <p className="text-[11px] text-slate-400 tabular-nums">
                現在 {typeCountMap['戸建て'] || 0} 件公示中
              </p>
            </Link>

            <Link
              href="/map?types[]=マンション"
              className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-[#1B4F8A] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <span>マンション物件</span>
              </div>
              <p className="text-[11px] text-slate-400 tabular-nums">
                現在 {typeCountMap['マンション'] || 0} 件公示中
              </p>
            </Link>
          </div>
        </section>

        {/* 4. POPULAR RAILWAY LINES HUB */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-6 shadow-none">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                主要沿線・鉄道路線から探す
              </h2>
            </div>
            <Link
              href="/search/station"
              className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>全国の路線・駅一覧</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 text-xs">
            {POPULAR_LINES.map((line) => (
              <Link
                key={line.name}
                href={`/search/station/${encodeURIComponent(line.name)}`}
                className="px-3 py-2 rounded border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/60 hover:border-[#1B4F8A] transition-colors flex items-center justify-between"
              >
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                  {line.name}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </Link>
            ))}
          </div>
        </section>

        {/* 5. REALTIME NEW PROPERTIES (SSR HTML Links for Bot Indexing) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                新着競売・公売物件速報
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                本日更新された全国の新規公示案件（最新12件）
              </p>
            </div>
            <Link
              href="/map"
              className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>もっと見る</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serializedProperties.map((prop) => (
              <div key={prop.sale_unit_id} className="h-full">
                <PropertyCard property={prop} />
              </div>
            ))}
          </div>
        </section>

        {/* 6. AUCTION RESULTS DATA SUMMARY & CTA */}
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-6 shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                全国落札結果データベース・相場リサーチ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                直近の開札結果と売却基準価額に対する落札倍率データ
              </p>
            </div>
            <Link
              href="/auction-results"
              className="px-4 py-2 text-xs font-medium bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded transition-colors whitespace-nowrap"
            >
              落札結果一覧を見る
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {recentAuctionResults.map((res) => {
              const margin = res.marginRate
                ? (res.marginRate > 5 ? res.marginRate : res.marginRate * 100).toFixed(1)
                : null;
              const winPriceMan = res.winningPrice
                ? `${Math.round(Number(res.winningPrice) / 10000).toLocaleString('ja-JP')}万円`
                : '-';

              return (
                <div
                  key={res.id}
                  className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-200/60 dark:border-zinc-800 text-xs"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {res.caseNumber}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {res.address || '所在地情報あり'}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-slate-400 block">落札価額</span>
                      <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
                        {winPriceMan}
                      </strong>
                    </div>
                    {margin && (
                      <span className="text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
                        倍率: {margin}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
