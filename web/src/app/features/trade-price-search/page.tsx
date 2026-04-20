import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Search, TrendingUp, Sparkles, Building2, ShieldCheck, JapaneseYen, ArrowRight, MousePointer2 } from 'lucide-react';
import LanguageBanner from '@/components/LanguageBanner';

export const metadata: Metadata = {
  title: '国土交通省データ 不動産取引価格検索 | 過去の売買データから相場を査定',
  description: 'AIが過去5年間の国土交通省（MLIT）取引履歴を分析。競売物件や中古不動産の適正な市場価格（相場）を誰でも無料で調査・査定できるツールです。',
  alternates: {
    languages: {
      'ja': '/features/trade-price-search',
      'en': '/en/features/trade-price-search',
      'vi': '/vi/features/trade-price-search',
      'zh': '/zh/features/trade-price-search'
    }
  }
};

export default function TradePriceFeatureLandingPage() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20 overflow-x-hidden">
      <LanguageBanner currentLang="ja" pagePath="/features/trade-price-search" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/70 dark:from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
          <Sparkles className="w-4 h-4" /> 誰でもプロ級の相場分析を
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          国土交通省の実取引データで、<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">不動産の「真の価値」を探る。</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          不動産会社の言い値ではなく、政府機関（MLIT）が収集した過去5年間の実際の売買履歴をAIが解析。競売物件や中古物件の適正相場を1秒で査定します。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/trade/find"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Search className="w-5 h-5" /> 今すぐ無料で検索する
          </Link>
        </div>
      </section>

      {/* Feature 1: Problem vs Solution */}
      <section className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                「その価格、本当に適正ですか？」
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                チラシやポータルサイトの販売価格は「売り主の希望価格」であり、実際に売れた価格ではありません。競売の落札価格を決める際も、周囲の相場を知らないと「高値づかみ」をする危険があります。
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ShieldCheck className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  <p><strong>安心の公的データ：</strong> 国土交通省（MLIT）の「不動産取引価格情報」をダイレクトに取得・分析しています。</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  <p><strong>過去5年分のトレンド：</strong> エリアごとの価格推移（平米単価）をグラフで可視化。</p>
                </li>
              </ul>
            </div>
            
            {/* Mockup Placeholder */}
            <Link href="/trade/find" className="relative rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 overflow-hidden aspect-video group block cursor-pointer">
              <div className="absolute inset-0 bg-blue-100/30 dark:bg-indigo-900/20 backdrop-blur-[1px] flex items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  <MousePointer2 className="w-4 h-4 animate-bounce" /> ここをクリックして検索画面へ
                </div>
              </div>
              <img src="/trade-price-search.webp" alt="Trade Price Search UI" className="w-full h-full object-cover rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>
        </div>
      </section>

      {/* How to use */}
      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-12">使い方はたったの3ステップ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative z-10 transition-transform hover:-translate-y-1">
               <div className="w-10 h-10 bg-blue-600 text-white font-black rounded-full flex items-center justify-center text-lg mx-auto mb-4 border-4 border-blue-100 dark:border-blue-900/50">1</div>
               <h3 className="font-bold text-lg mb-2 dark:text-white">エリアを入力</h3>
               <p className="text-sm text-zinc-600 dark:text-zinc-400">「東京都新宿区」など、調べたい市区町村を入力します。</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative z-10 transition-transform hover:-translate-y-1">
               <div className="w-10 h-10 bg-blue-600 text-white font-black rounded-full flex items-center justify-center text-lg mx-auto mb-4 border-4 border-blue-100 dark:border-blue-900/50">2</div>
               <h3 className="font-bold text-lg mb-2 dark:text-white">物件種別を選択</h3>
               <p className="text-sm text-zinc-600 dark:text-zinc-400">戸建て、マンション、土地など、種別を絞り込みます。</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative z-10 transition-transform hover:-translate-y-1">
               <div className="w-10 h-10 bg-blue-600 text-white font-black rounded-full flex items-center justify-center text-lg mx-auto mb-4 border-4 border-blue-100 dark:border-blue-900/50">3</div>
               <h3 className="font-bold text-lg mb-2 dark:text-white">過去の取引実績を確認</h3>
               <p className="text-sm text-zinc-600 dark:text-zinc-400">築年数や面積ごとの詳細な売買価格が一覧で表示されます。</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-10 border border-indigo-100 dark:border-indigo-800/30">
          <JapaneseYen className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-4">競売物件のポテンシャルを測る最強の相棒</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
            市場の「実勢価格」を知ることで、競売での入札額の目安が明確になります。利回りを最大化するための第一歩を踏み出しましょう。
          </p>
          <Link
            href="/trade/find"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3.5 text-base font-bold shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all hover:scale-105"
          >
            取引価格を検索する <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
