import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Map, ArrowRight, TrendingUp, Sparkles, MapPin, Calculator, MousePointer2 } from 'lucide-react';

export const metadata: Metadata = {
  title: '競売物件のマップ検索・AI相場査定｜Keibai Finder機能紹介',
  description: '文字だけの競売情報から卒業しませんか？Keibai Finderのマップ検索なら直感的に周囲の物件と比較可能。国交省データとAIを用いた「投資ギャップ（Investment Gap）」査定機能について解説します。',
};

export default function MapFeatureLandingPage() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50/50 dark:from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-300 text-sm font-semibold mb-6 shadow-sm border border-blue-100 dark:border-indigo-800/50">
          <Sparkles className="w-4 h-4" /> 次世代の競売ソリューション
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          地図で探す。<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">AIが適正価格を見抜く。</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          Keibai Finderなら、裁判所の競売物件も、行政の公売物件も、Googleマップと同じ感覚で横断検索。さらに「本当の価値」を可視化するAIギャップ分析を搭載。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/trade/find"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Map className="w-5 h-5" /> 今すぐマップで探す
          </Link>
        </div>
      </section>

      {/* 2. Feature 1: Map Search */}
      <section className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                直感的に、街の競売物件を見つける。
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                従来の「リスト形式」で住所だけを見ても、生活環境や周辺の地価は想像できません。
                マップ検索機能を使えば、現在募集中の競売物件・公売物件が地図上にピンで表示され、駅からの距離や周辺施設が一目でわかります。
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  裁判所（競売）と役所（公売）のデータを一本化。
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  過去に落札された物件の「実際の落札価格」も地図で確認可能（近日強化予定）。
                </li>
              </ul>
            </div>
            <div className="relative rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 overflow-hidden aspect-video group">
              <div className="absolute inset-0 bg-blue-100/50 dark:bg-indigo-900/20 backdrop-blur-[2px] flex items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  <MousePointer2 className="w-4 h-4 animate-bounce" /> 地図を動かして探す
                </div>
              </div>
              {/* Fake Map UI Mockup */}
              <div className="w-full h-full bg-zinc-100 dark:bg-zinc-700 rounded-xl relative overflow-hidden">
                 <div className="absolute top-[20%] left-[30%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                    </span>
                    <div className="mt-1 bg-white dark:bg-zinc-900 text-xs font-bold px-2 py-0.5 rounded shadow-sm">1,250万円</div>
                 </div>
                 <div className="absolute top-[60%] right-[20%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-4 w-4">
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border border-white"></span>
                    </span>
                    <div className="mt-1 bg-white dark:bg-zinc-900 text-xs font-bold px-2 py-0.5 rounded shadow-sm text-rose-600">公売 80万円</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature 2: MLIT Gap Analysis */}
      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center flex-col-reverse lg:flex-row-reverse">
            <div className="order-2 lg:order-1">
              {/* Fake MLIT UI Mockup */}
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" /> 市場価格との乖離（ギャップ）
                  </h3>
                </div>
                <div className="space-y-6">
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">国交省データに基づく推定市場価格</p>
                     <p className="text-2xl font-black text-zinc-900 dark:text-white">約 2,850 <span className="text-base font-normal">万円</span></p>
                   </div>
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">競売の基準価格</p>
                     <p className="text-2xl font-black text-blue-600 dark:text-blue-400">1,420 <span className="text-base font-normal">万円</span></p>
                   </div>
                   <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                     <div className="flex items-center justify-between">
                       <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI 投資ギャップ判定</p>
                       <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
                         <TrendingUp className="w-4 h-4" /> +100.7% の割安
                       </span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                国交省データ × AI査定で<br/>「本当の価値」を可視化。
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                競売物件の基準価格が「安い」のは当然ですが、**市場相場と比較してどれくらいお買い得なのか**を自分で計算するのは非常に手間がかかります。
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Keibai Finderは、国土交通省の「不動産取引価格情報」データ（過去数百万件）と連携。物件の面積や築年数から、その地域の**「推定市場価格」**を即座に割り出し、競売価格との差額（Investment Gap）を自動計算します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEO Content & Text block */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">なぜ「マップ検索」と「AI査定」が必要なのか？</h2>
          
          <div className="prose prose-blue dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              従来の競売不動産プラットフォーム（BIT等）では、大量のテキストやPDF（3点セット）の中から手作業で優良物件を探し出す必要がありました。「競売物件 マップ検索」を導入することで、土地勘のないエリアでも、近接する駅や道路付け、都市計画上の制約などを地図ベースでスピーディに確認できるようになります。
            </p>
            <p>
              また、「本当にこの価格で入札して利益が出るのか？」という投資家の最大の悩みを解決するため、「競売 AI 査定」機能（Investment Gap）を開発しました。競売は相場より安いとはいえ、リフォーム費用や占有者退去のコスト（立ち退き料等）が見込まれるため、市場価格との間に十分な**ギャップ（利ざや）**が存在しなければなりません。
            </p>
            <p>
              Keibai Finderのデータ駆動型アプローチを活用して、効率的で精度の高い競売・公売物件探しをぜひ体験してください。
            </p>
          </div>
          
          <div className="mt-12 text-center text-xs text-zinc-500">
            関連キーワード: 競売物件 マップ検索, 公売 地図 検索, 競売 AI 査定, 不動産 競売 過去相場, 競売 落札予想
          </div>
        </div>
      </section>
    </div>
  );
}
