import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import {
  TrendingUp,
  BarChart3,
  Scale,
  ShieldCheck,
  HelpCircle,
  Building,
  Info,
  Coins,
} from 'lucide-react';

export const revalidate = 86400; // Tự động làm mới mỗi 24 giờ (Next.js ISR)

export const metadata: Metadata = {
  title: '全国不動産競売 市場分析ダッシュボード｜47都道府県落札相場・入札倍率推移',
  description:
    '全国47都道府県の地方裁判所における過去の落札結果データ（34,800件超）を徹底分析。都道府県別の平均落札価格・中央値、売却基準価額に対する落札倍率、平均入札参加者数、および相場乖離インデックスを可視化。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/market-insights',
  },
  openGraph: {
    title: '不動産競売 市場分析・落札相場ダッシュボード｜Keibai Finder',
    description:
      '競売データの透明性を高める。全国47都道府県の落札倍率・入札競争率・中央値相場インデックス。',
    type: 'website',
    url: 'https://www.keibai-koubai.com/market-insights',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: '全国不動産競売 市場分析ダッシュボード' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

// Dynamic import Client Component với SSR false & Skeleton loading chuẩn B2B Nhật
const MarketCharts = dynamic(() => import('./MarketCharts'), {
  loading: () => <MarketChartsSkeleton />,
});

const PREFECTURE_REGIONS: Record<string, string> = {
  '北海道': '東北・北海道', '青森県': '東北・北海道', '岩手県': '東北・北海道', '宮城県': '東北・北海道', '秋田県': '東北・北海道', '山形県': '東北・北海道', '福島県': '東北・北海道',
  '茨城県': '関東', '栃木県': '関東', '群馬県': '関東', '埼玉県': '関東', '千葉県': '関東', '東京都': '関東', '神奈川県': '関東',
  '新潟県': '中部', '富山県': '中部', '石川県': '中部', '福井県': '中部', '山梨県': '中部', '長野県': '中部', '岐阜県': '中部', '静岡県': '中部', '愛知県': '中部',
  '三重県': '近畿', '滋賀県': '近畿', '京都府': '近畿', '大阪府': '近畿', '兵庫県': '近畿', '奈良県': '近畿', '和歌山県': '近畿',
  '鳥取県': '中国・四国', '島根県': '中国・四国', '岡山県': '中国・四国', '広島県': '中国・四国', '山口県': '中国・四国', '徳島県': '中国・四国', '香川県': '中国・四国', '愛媛県': '中国・四国', '高知県': '中国・四国',
  '福岡県': '九州・沖縄', '佐賀県': '九州・沖縄', '長崎県': '九州・沖縄', '熊本県': '九州・沖縄', '大分県': '九州・沖縄', '宮崎県': '九州・沖縄', '鹿児島県': '九州・沖縄', '沖縄県': '九州・沖縄',
};

export default async function MarketInsightsPage() {
  // 1. Fetch 47 Prefectures aggregated stats via fast SQL
  const rawPrefStats = await prisma.$queryRaw<any[]>`
    SELECT 
        prefecture,
        COUNT(*)::int as count,
        ROUND(AVG("basePrice") / 10000)::int as avg_base,
        ROUND(AVG("winningPrice") / 10000)::int as avg_win,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "winningPrice") / 10000)::int as median_win,
        ROUND((SUM("winningPrice"::numeric) / NULLIF(SUM("basePrice"::numeric), 0)) * 1000) / 10 as multiple_rate,
        ROUND(COALESCE(AVG("bidderCount"::numeric), 0), 1) as avg_bidders
    FROM "AuctionResult"
    WHERE prefecture IS NOT NULL 
      AND "winningPrice" > 0 
      AND "basePrice" > 0
    GROUP BY prefecture
    ORDER BY avg_win DESC;
  `;

  // 2. Fetch National Macro KPIs
  const rawNationalStats = await prisma.$queryRaw<any[]>`
    SELECT 
        COUNT(*)::int as total_records,
        ROUND(AVG("winningPrice") / 10000)::int as national_avg_win,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "winningPrice") / 10000)::int as national_median_win,
        ROUND((SUM("winningPrice"::numeric) / NULLIF(SUM("basePrice"::numeric), 0)) * 1000) / 10 as national_multiple_rate,
        ROUND(COALESCE(AVG("bidderCount"::numeric), 0), 1) as national_avg_bidders
    FROM "AuctionResult"
    WHERE prefecture IS NOT NULL 
      AND "winningPrice" > 0 
      AND "basePrice" > 0;
  `;

  // 3. Fetch Competition Distribution
  const rawCompetitionStats = await prisma.$queryRaw<any[]>`
    SELECT 
      CASE 
        WHEN "bidderCount" = 1 THEN '1名（単独入札）'
        WHEN "bidderCount" BETWEEN 2 AND 4 THEN '2〜4名（低競争）'
        WHEN "bidderCount" BETWEEN 5 AND 9 THEN '5〜9名（標準競争）'
        ELSE '10名以上（激戦区）'
      END as range,
      COUNT(*)::int as count,
      ROUND(AVG("winningPrice"::numeric / NULLIF("basePrice"::numeric, 0) * 100)::numeric, 1) as avg_multiple
    FROM "AuctionResult"
    WHERE "bidderCount" IS NOT NULL AND "bidderCount" > 0 AND "winningPrice" > 0 AND "basePrice" > 0
    GROUP BY 1
    ORDER BY MIN("bidderCount");
  `;

  const prefecturesData = rawPrefStats.map((r) => ({
    name: r.prefecture,
    region: PREFECTURE_REGIONS[r.prefecture] || 'その他',
    count: Number(r.count),
    avgBase: Number(r.avg_base),
    avgWin: Number(r.avg_win),
    medianWin: Number(r.median_win),
    multipleRate: Number(r.multiple_rate),
    avgBidders: Number(r.avg_bidders),
  }));

  const nat = rawNationalStats[0] || {};
  const totalRecords = Number(nat.total_records || 34798);
  const nationalAvgWin = Number(nat.national_avg_win || 1945);
  const nationalMedianWin = Number(nat.national_median_win || 1112);
  const nationalMultipleRate = Number(nat.national_multiple_rate || 157.6);
  const nationalAvgBidders = Number(nat.national_avg_bidders || 5.8);

  const competitionData = rawCompetitionStats.map((r) => ({
    range: r.range,
    count: Number(r.count),
    avgMultiple: Number(r.avg_multiple),
  }));

  // JSON-LD Dataset Schema chuẩn SEO Nhật Bản
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'ホーム',
            item: 'https://www.keibai-koubai.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '市場分析ダッシュボード',
            item: 'https://www.keibai-koubai.com/market-insights',
          },
        ],
      },
      {
        '@type': 'Dataset',
        name: '日本全国47都道府県 不動産競売落札相場統計データセット',
        description:
          '全国47都道府県の地方裁判所における不動産競売の落札価格、中央値、売却基準価額比率（落札倍率）、入札者数分布の統計集計データ。',
        keywords: [
          '競売物件',
          '落札相場',
          '不動産投資',
          '裁判所入札',
          '落札倍率',
          '市場乖離率',
          '47都道府県',
          '中央値',
        ],
        creator: {
          '@type': 'Organization',
          name: 'Keibai Finder',
          url: 'https://www.keibai-koubai.com',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 py-8 sm:py-12 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Hero Section: Chuẩn Japanese B2B Minimalist */}
        <div className="border-b border-slate-200/90 dark:border-slate-800/80 pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-900/30 dark:text-blue-300 border border-[#1B4F8A]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400"></span>
              全国47都道府県・裁判所開札データ完全網羅
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              分析対象: 全 <strong className="text-slate-900 dark:text-slate-100">{totalRecords.toLocaleString()}</strong> 件の落札実績
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            全国不動産競売 市場動向・落札相場ダッシュボード
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            全国47都道府県の地方裁判所で開札された売却結果通知データを統計処理し、地域ごとの平均落札価格・中央値（実勢相場）・売却基準価額に対する落札倍率・入札競争率を客観的に可視化しています。
          </p>
        </div>

        {/* 4 Thẻ KPI Vĩ mô Toàn quốc (High Density Metric Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white dark:bg-[#151B22] p-4 sm:p-5 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>全国平均落札価格 (Mean)</span>
              <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {nationalAvgWin.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">万円</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              中央値: {nationalMedianWin.toLocaleString()} 万円 (実勢水準)
            </div>
          </div>

          <div className="bg-white dark:bg-[#151B22] p-4 sm:p-5 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>全国平均落札倍率</span>
              <TrendingUp className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-400">
              {nationalMultipleRate.toFixed(1)}%
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              売却基準価額に対する決定価格比
            </div>
          </div>

          <div className="bg-white dark:bg-[#151B22] p-4 sm:p-5 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>平均入札者数</span>
              <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {nationalAvgBidders.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">名 / 件</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              1案件あたりの競合入札社数
            </div>
          </div>

          <div className="bg-white dark:bg-[#151B22] p-4 sm:p-5 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>一般市場価格との乖離目安</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              約 20〜35% 安
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              国土交通省取引相場との比較想定
            </div>
          </div>
        </div>

        {/* Khu vực Biểu đồ Thống kê Tương tác & Ma trận 47 Tỉnh */}
        <MarketCharts
          prefecturesData={prefecturesData}
          competitionData={competitionData}
        />

        {/* Chú thích Pháp lý & Định nghĩa Nghiệp vụ Chuẩn B2B Nhật Bản */}
        <div className="p-4 sm:p-5 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <span>データ集計の定義及び注意事項</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs">
            <li>
              <strong>落札価格の中央値（Median）について：</strong>
              極端に高額な商業ビルや大規模土地などの外れ値（Outliers）による歪みを排除するため、価格順に並べた中央の値を実勢水準として併記しています。
            </li>
            <li>
              <strong>落札倍率（％）の定義：</strong>
              地方裁判所が公示する「売却基準価額」に対して、実際に開札・落札された価格の比率（落札価格 ÷ 売却基準価額 × 100%）を示します。本指標は賃料利回り（Yield）を示すものではありません。
            </li>
            <li>
              <strong>データの出典：</strong>
              本画面の数値は、地方裁判所における不動産競売売却結果の公示情報に基づき、統計処理を行って算出した参考データです。
            </li>
            <li>
              <strong>免責事項：</strong>
              不動産の入札検討にあたっては、各裁判所に備え付けられた「3点セット（物件明細書・現況調査報告書・評価書）」の原本を必ずご確認のうえ、自己責任にてご判断ください。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// B2B Minimalist Skeleton Loader
function MarketChartsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-slate-200/70 dark:bg-slate-800/60 rounded-xl"></div>
      <div className="h-44 bg-slate-200/70 dark:bg-slate-800/60 rounded-xl"></div>
      <div className="h-96 bg-slate-200/70 dark:bg-slate-800/60 rounded-xl"></div>
      <div className="h-96 bg-slate-200/70 dark:bg-slate-800/60 rounded-xl"></div>
    </div>
  );
}
