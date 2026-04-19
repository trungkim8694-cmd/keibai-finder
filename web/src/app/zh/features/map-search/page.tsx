import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Map, ArrowRight, TrendingUp, Sparkles, MapPin, Calculator, MousePointer2 } from 'lucide-react';

export const metadata: Metadata = {
  title: '在地图上寻找日本法拍房。AI 揭示真实价值。',
  description: '日本房地产法拍地图搜索与基于国土交通省数据的 AI 估值。发现日本投资潜力。',
  alternates: {
    languages: {
      'ja': '/features/map-search',
      'en': '/en/features/map-search',
      'vi': '/vi/features/map-search',
      'zh': '/zh/features/map-search'
    }
  }
};

export default function MapFeatureLandingPageZH() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50/50 dark:from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-300 text-sm font-semibold mb-6 shadow-sm border border-blue-100 dark:border-indigo-800/50">
          <Sparkles className="w-4 h-4" /> 下一代日本房地产投资
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          在地图上寻找日本法拍房。<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">AI 揭示真实价值。</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          告别繁琐的列表。通过谷歌地图直观地搜索日本法院法拍房和公卖房产。利用政府数据，AI为您自动计算极具潜力的投资差价。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Map className="w-5 h-5" /> 立即在地图上搜索
          </Link>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                直观定位日本房产位置
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                传统的地址列表无法让您了解周边环境。有了地图搜索功能，拍卖中的房产将直接在地图上以大头针形式显示，让您一目了然地看到距离车站和便利设施的距离。
              </p>
            </div>
            <Link href="/" className="relative rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 overflow-hidden aspect-video group block cursor-pointer">
              <div className="absolute inset-0 bg-blue-100/50 dark:bg-indigo-900/20 backdrop-blur-[2px] flex items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  <MousePointer2 className="w-4 h-4 animate-bounce" /> 拖动地图浏览
                </div>
              </div>
              <div className="w-full h-full bg-zinc-100 dark:bg-zinc-700 rounded-xl relative overflow-hidden">
                 <div className="absolute top-[20%] left-[30%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                    </span>
                    <div className="mt-1 bg-white dark:bg-zinc-900 text-xs font-bold px-2 py-0.5 rounded shadow-sm">1,250万日元</div>
                 </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center flex-col-reverse lg:flex-row-reverse">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" /> 市场价格差距（投资潜力）
                  </h3>
                </div>
                <div className="space-y-6">
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">估算市场价值（基于日本政府数据）</p>
                     <p className="text-2xl font-black text-zinc-900 dark:text-white">约 2,850 <span className="text-base font-normal">万日元</span></p>
                   </div>
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">法拍基准价格</p>
                     <p className="text-2xl font-black text-blue-600 dark:text-blue-400">1,420 <span className="text-base font-normal">万日元</span></p>
                   </div>
                   <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                     <div className="flex items-center justify-between">
                       <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI 投资评估</p>
                       <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
                         <TrendingUp className="w-4 h-4" /> 巨幅折价 +100.7%
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
                利用政府数据验证“真实价值”
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                 法拍房价格低廉是众所周知的，但自行计算它是否真正值得投资却非常困难。Keibai Finder 对接日本国土交通省的真实房地产交易数据，即时为您评估市场价值以及升值潜力。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
