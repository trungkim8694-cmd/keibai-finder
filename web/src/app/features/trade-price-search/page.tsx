import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Search, TrendingUp, Building2, ShieldCheck, JapaneseYen, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '国土交通省データ 不動産取引価格検索｜過去の売買データから相場を査定',
  description: 'AIが過去5年間の国土交通省（MLIT）取引履歴を分析。競売物件や中古不動産の適正な市場価格（相場）を誰でも無料で調査・査定できるツールです。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/features/trade-price-search',
  },
  openGraph: {
    title: '国土交通省データ 不動産取引価格検索｜Keibai Finder',
    description: 'AIが過去5年間の国土交通省（MLIT）取引履歴を分析し、適正な市場価格を査定。',
    url: 'https://www.keibai-koubai.com/features/trade-price-search',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/trade-price-search.webp', width: 1200, height: 630, alt: '国土交通省データ 不動産取引価格検索' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/trade-price-search.webp'],
  },
};

export default function TradePriceFeatureLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.keibai-koubai.com/features/trade-price-search#webpage',
        url: 'https://www.keibai-koubai.com/features/trade-price-search',
        name: '国土交通省データ 不動産取引価格検索',
        inLanguage: 'ja',
        isPartOf: { '@id': 'https://www.keibai-koubai.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: '機能一覧', item: 'https://www.keibai-koubai.com/features' },
          { '@type': 'ListItem', position: 3, name: '価格査定の仕組み', item: 'https://www.keibai-koubai.com/features/trade-price-search' },
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
            <span className="text-slate-800 dark:text-slate-200">不動産取引価格検索</span>
          </nav>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400"></span>
            国土交通省実取引データ連携
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
            国土交通省の実取引データで、不動産の「真の価値」を探る
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            不動産会社の売出希望価格ではなく、国土交通省（MLIT）が収集した過去5年間の実成約履歴をAIが解析。競売物件や中古物件の適正相場を迅速に調査・査定できます。
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/trade-find"
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-[#1B4F8A] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#143D6C] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F8A] min-h-[44px]"
            >
              <Search className="w-4 h-4" /> 今すぐ無料で取引価格を検索する
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Tier Layout TIER 2 & 3: Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* Feature 1: Problem vs Solution */}
        <section className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200/80 dark:border-rose-900/50">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                その入札価格、本当に適正ですか？
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                チラシやポータルサイトの販売価格は「売り主の希望価格」であり、実際に成立した成約価格ではありません。競売の落札価格を決定する際も、周囲の実勢相場を正確に把握していないと「高値づかみ」をするリスクが高まります。
              </p>
              <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex gap-2.5 items-start">
                  <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-slate-100">公的機関の取引データ：</strong>
                    国土交通省（MLIT）の「不動産取引価格情報」をダイレクトに取得・分析しています。
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-slate-100">過去5年分の価格推移：</strong>
                    市区町村・町丁目ごとの平米単価推移をグラフで直感的に可視化します。
                  </div>
                </li>
              </ul>
            </div>

            {/* Illustration & Accessible CTA */}
            <div>
              <div className="rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 overflow-hidden aspect-video">
                <img
                  src="/trade-price-search.webp"
                  alt="国土交通省データ 不動産取引価格検索画面イメージ"
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div className="mt-3">
                <Link
                  href="/trade-find"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors shadow-sm min-h-[44px]"
                >
                  <Search className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  取引価格検索画面を開く
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: How to use (3 Steps) */}
        <section className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              実勢相場査定の3ステップ
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              直感的な操作で、知りたいエリアの過去成約データをすぐに確認できます。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 font-bold font-mono text-sm flex items-center justify-center mb-3 border border-blue-200 dark:border-blue-900/50">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                エリアを指定
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                都道府県および市区町村を選択し、調査対象エリアを絞り込みます。
              </p>
            </div>

            <div className="p-5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 font-bold font-mono text-sm flex items-center justify-center mb-3 border border-blue-200 dark:border-blue-900/50">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                物件種別を選択
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                土地・戸建て・マンションなど、比較したい物件種別を指定します。
              </p>
            </div>

            <div className="p-5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 font-bold font-mono text-sm flex items-center justify-center mb-3 border border-blue-200 dark:border-blue-900/50">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                成約実績・平米単価を確認
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                築年数・面積・取引時期ごとの成約価格データと推移グラフを確認します。
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-200/80 dark:border-blue-900/50">
              <JapaneseYen className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              競売物件の適正入札価格と実勢相場を精緻に分析
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              市場の「実勢取引価格」を事前に把握することで、競売入札時の判断基準が明確になります。高値づかみを回避し、投資採算性の高い入札戦略を支援します。
            </p>
            <Link
              href="/trade-find"
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-[#1B4F8A] text-white px-8 py-3 text-sm font-bold shadow-sm hover:bg-[#143D6C] transition-colors min-h-[44px]"
            >
              取引価格データを検索する <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
