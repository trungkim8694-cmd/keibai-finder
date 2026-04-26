import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Map, ArrowRight, Layers, Sparkles, AlertTriangle, Building2, MousePointer2 } from 'lucide-react';
import LanguageBanner from '@/components/LanguageBanner';

export const metadata: Metadata = {
  title: 'エリア分析マップ（災害・都市計画）｜Keibai Finder機能紹介',
  description: '国土地理院と国土交通省の公式データを統合した、究極のエリア分析マップ。不動産投資やマイホーム購入前に、洪水・土砂などの自然災害リスクと用途地域の建ぺい率・容積率を一画面で徹底調査できます。',
  alternates: {
    languages: {
      'ja': '/features/area-map',
      'en': '/en/features/area-map',
      'vi': '/vi/features/area-map',
      'zh': '/zh/features/area-map'
    }
  }
};

export default function AreaMapFeatureLandingPage() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      <LanguageBanner />
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-rose-50/50 dark:from-rose-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-sm font-semibold mb-6 shadow-sm border border-rose-100 dark:border-rose-800/50">
          <Sparkles className="w-4 h-4" /> 投資リスクを事前にブロック
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          競売物件の「見えないリスク」。<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500 dark:from-rose-400 dark:to-orange-300">1つの地図で、すべて暴く。</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          入札の前に必ず確認すべき「ハザードマップ（洪水・土砂・津波）」と「都市計画（用途地域・建蔽率・容積率）」。Keibai Finderなら国交省の膨大なデータをワンタップで呼び出せます。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/area-map"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-rose-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-rose-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <Layers className="w-5 h-5" /> 今すぐエリアを分析する
          </Link>
        </div>
      </section>

      {/* 2. Feature 1: Hazard Map */}
      <section className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                国土地理院データを直結。命と資産を守るハザード機能。
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                政府が提供する「重ねるハザードマップ」システムとサーバーレベルで連動しています。行政のサイトに行かなくても、物件を中心とした災害リスクを高速でカラー描画します。
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  洪水、土砂災害、津波、高潮の4大リスクをレイヤー（層）で重ねて表示。
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  指定緊急避難場所までの直線距離と「徒歩何分か」をAIが自動計算し、ポップアップでお知らせします。
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8 flex flex-col gap-4">
               <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-red-700 dark:text-red-400">
                    <span className="text-lg">🌊</span> 洪水 (Flood)
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">浸水想定 3.0m未満</div>
               </div>
               <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-orange-700 dark:text-orange-400">
                    <span className="text-lg">⛰️</span> 土砂災害 (Landslide)
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">警戒区域 (イエローゾーン)</div>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="text-lg">🏕</span> 指定緊急避難場所
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">〇〇小学校 (徒歩約6分)</div>
               </div>
               <div className="text-right text-xs text-zinc-500 mt-2">※ 画面はシステム解析結果のイメージです</div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Feature 2: Zoning & Urban Planning */}
      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center flex-col-reverse lg:flex-row-reverse">
            
            <div className="order-2 lg:order-1 rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" /> 都市計画データ解析
                </h3>
              </div>
              <div className="space-y-6">
                 <div>
                   <p className="text-sm text-zinc-500 mb-1">用途地域 (Land Use)</p>
                   <p className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center justify-between">
                     第一種住居地域
                     <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">重なるエリア表示中</span>
                   </p>
                 </div>
                 <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-medium text-zinc-500">建蔽率 (Coverage)</p>
                     <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">60%</p>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-zinc-500">容積率 (FAR)</p>
                     <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">200%</p>
                   </div>
                 </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
                 <span>💡 投資のヒント: この建蔽率・容積率なら、将来アパートへの建て替えが十分に期待できる好立地です。</span>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                「建蔽率・容積率」を瞬時に暴く<br/>クリック型ピンポイント解析。
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                土地の資産価値は、上にどんな建物を建てられるか（用途地域）で決まります。しかし、役所のホームページで用途地域を調べるのは非常に難解で時間がかかります。
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Keibai Finderの「都市計画レイヤー」なら、地図上の気になる土地をクリックするだけ。その土地に設定されている用途地域、建蔽率（％）、容積率（％）を国土交通省の公式データから即座に引っ張り出し、土地の形に沿って美しくハイライト表示します。透過度バー（Opacity slider）で下地の地図と重ね合わせることも簡単です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEO Content & Text block */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">トラブルを防ぐための最強の事前調査ツール</h2>
          
          <div className="prose prose-blue dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              競売不動産は「原則現状渡し」であり、購入後に「実は土砂災害の危険地帯だった」「家を建て替えようとしたら容積率が低すぎて小さな家しか建てられなかった」といったトラブルが後を絶ちません。だからこそ、不動産投資において事前のエリア分析は必須科目です。
            </p>
            <p>
              当社のエンジニアチームが開発した**「エリア分析マップ（災害・都市計画）」**は、国交省の不動産情報ライブラリ（API）と国土地理院のオープンデータを最先端のPoint-in-Polygonアルゴリズムで結合した画期的なシステムです。これにより、重い地図データをダウンロードすることなく、スマートフォンからでも即座に物件周辺の法規制とリスクを把握することができます。
            </p>
            <p>
              物件を買う前、入札を入れる前に、必ずこのツールを開き、「見えないリスク」をコントロールしてください。この強力な調査ツールはすべて無料で提供されています。
            </p>
          </div>
          
          <div className="mt-12 text-center text-xs text-zinc-500">
            関連キーワード: 不動産 ハザードマップ, 用途地域 調べ方, 建蔽率 容積率 マップ, 競売 エリア調査, 洪水浸水想定区域 地図, 都市計画図 無料
          </div>
        </div>
      </section>
    </div>
  );
}
