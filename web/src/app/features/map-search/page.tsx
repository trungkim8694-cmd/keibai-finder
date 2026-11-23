import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Map, ArrowRight, TrendingUp, MapPin, Calculator } from 'lucide-react';

export const metadata: Metadata = {
  title: '競売物件のマップ検索・AI相場査定の使い方',
  description: '文字だけの競売情報から卒業しませんか？Keibai Finderのマップ検索なら直感的に周囲の物件と比較可能。国交省データとAIを用いた「投資ギャップ（Investment Gap）」査定機能について解説します。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/features/map-search',
  },
  openGraph: {
    title: '競売物件のマップ検索・AI相場査定の使い方｜Keibai Finder',
    description: '地図上で直感的に競売・公売物件を比較し、AIギャップ分析で適正価格を見抜く方法。',
    url: 'https://www.keibai-koubai.com/features/map-search',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: '競売物件のマップ検索・AI相場査定' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

export default function MapFeatureLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.keibai-koubai.com/features/map-search#webpage',
        url: 'https://www.keibai-koubai.com/features/map-search',
        name: '競売物件のマップ検索・AI相場査定の使い方',
        inLanguage: 'ja',
        isPartOf: { '@id': 'https://www.keibai-koubai.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: '機能一覧', item: 'https://www.keibai-koubai.com/features' },
          { '@type': 'ListItem', position: 3, name: '地図検索の使い方', item: 'https://www.keibai-koubai.com/features/map-search' },
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

      {/* 3-Tier Layout TIER 1: Header Banner with Breadcrumbs */}
      <section className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <nav className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Link href="/" className="hover:text-[#1B4F8A] transition-colors">
              ホーム
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/features" className="hover:text-[#1B4F8A] transition-colors">
              機能一覧
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-slate-800 dark:text-slate-200">地図検索・AI相場査定</span>
          </nav>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400"></span>
            位置情報・AIギャップ分析
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
            地図で探す。AIが適正価格を見抜く。
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Keibai Finderなら、裁判所の競売物件も、行政の公売物件も、地図上で直感的に横断検索。さらに国土交通省データに基づくAIギャップ分析で「本当の市場価値」を可視化します。
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-[#1B4F8A] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#143D6C] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F8A] min-h-[44px]"
            >
              <Map className="w-4 h-4" /> 今すぐマップで物件を探す
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Tier Layout TIER 2 & 3: Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* Section 1: Map Search */}
        <section className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-200/80 dark:border-blue-900/50">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                直感的に、街の競売・公売物件を見つける
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                従来のリスト形式で住所だけを見ても、周辺の生活環境や駅へのアプローチ、隣接地との高低差は把握しづらい課題がありました。
                マップ検索機能を使えば、現在募集中の競売物件・公売物件が地図上にピンで表示され、駅からの距離や周辺施設が一目で確認できます。
              </p>
              <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex gap-2.5 items-start">
                  <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-slate-100">データの一本化：</strong>
                    裁判所（競売）と行政機関（公売）の公告データを1つの地図上で横断表示。
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-slate-100">過去の落札実績連携：</strong>
                    落札結果データベースと連動し、周辺エリアの実際の落札相場も地図から直接確認可能。
                  </div>
                </li>
              </ul>
            </div>

            {/* Map Preview & Accessible CTA */}
            <div>
              <div className="rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 overflow-hidden aspect-video">
                <img
                  src="/keibaikoubai.webp"
                  alt="競売・公売物件マップ検索画面イメージ"
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div className="mt-3">
                <Link
                  href="/"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors shadow-sm min-h-[44px]"
                >
                  <Map className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  地図検索を開いて物件を探す
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: MLIT Gap Analysis */}
        <section className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Mockup UI with Tabular Nums & Mobile Wrap */}
            <div className="order-2 lg:order-1">
              <div className="rounded-lg bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-700/80 pb-3 mb-4">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                    市場価格との乖離（投資ギャップ分析）
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      国交省データに基づく推定市場価格
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      約 <span className="tabular-nums font-mono text-2xl sm:text-3xl">2,850</span>{' '}
                      <span className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-400">万円</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      競売の売却基準価額
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400">
                      <span className="tabular-nums font-mono text-2xl sm:text-3xl">1,420</span>{' '}
                      <span className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-400">万円</span>
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-zinc-700/80">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        AI 投資ギャップ判定
                      </p>
                      <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded text-xs sm:text-sm font-semibold border border-amber-200 dark:border-amber-900/50">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="tabular-nums font-mono">+100.7%</span> の割安
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation with Fixed Strong Tags (No Raw Markdown) */}
            <div className="order-1 lg:order-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-200/80 dark:border-indigo-900/50">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                国交省データ × AI査定で「本当の価値」を可視化
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                競売物件の売却基準価額が一般市場より安価なのは当然ですが、
                <strong className="font-semibold text-slate-900 dark:text-slate-100">市場相場と比較してどれくらいお買い得なのか</strong>
                をご自身で手計算するには膨大な時間と労力がかかります。
              </p>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Keibai Finderは、国土交通省の「不動産取引価格情報」データ（過去数百万件）と連携。物件の構造・面積や築年数から、その地域の
                <strong className="font-semibold text-slate-900 dark:text-slate-100">「推定市場価格」</strong>
                を即座に割り出し、基準価格との差額（Investment Gap）を自動計算します。
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Educational Content (Fixed Raw Markdown & Purged SEO Spam) */}
        <section className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-center text-slate-900 dark:text-slate-100 mb-6">
              なぜ「マップ検索」と「AI査定」が必要なのか？
            </h2>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                従来の競売不動産プラットフォーム（BIT等）では、大量のテキストやPDF（物件明細書・現況調査報告書・評価書の3点セット）の中から手作業で優良物件を探し出す必要がありました。「競売物件 マップ検索」を活用することで、土地勘のないエリアでも、近接する駅や道路付け、都市計画上の制約などを地図ベースでスピーディに確認できるようになります。
              </p>
              <p>
                また、「本当にこの価格で入札して利益が出るのか？」という投資家の最大の課題を解決するため、「競売 AI 査定」機能（Investment Gap）を開発しました。競売は相場より安価に入手できる可能性がある反面、リフォーム費用や占有者退去のコスト（明渡手続き等）が見込まれるため、市場価格との間に十分な
                <strong className="font-semibold text-slate-900 dark:text-slate-100">ギャップ（利ざや）</strong>
                が存在しなければなりません。
              </p>
              <p>
                Keibai Finderのデータ駆動型アプローチを活用して、効率的で精度の高い競売・公売物件探しをぜひご活用ください。
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  全国の競売・公売物件を今すぐ地図で確認
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  会員登録不要でどなたでも無料でご利用いただけます
                </p>
              </div>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B4F8A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#143D6C] transition-colors min-h-[44px]"
              >
                <Map className="w-4 h-4" /> 地図検索を始める
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
