import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Layers, ArrowRight, Sparkles, AlertTriangle, Building2 } from 'lucide-react';
import LanguageBanner from '@/components/LanguageBanner';

export const metadata: Metadata = {
  title: '区域分析地图 (风险与城市规划) | Keibai Finder 功能介绍',
  description: '整合日本国土交通省与国土地理院数据的终极区域分析地图。在投资前，一键掌握洪水、山体滑坡等自然灾害风险，以及用地的建蔽率和容积率等重要规划信息。',
  alternates: {
    languages: {
      'ja': '/features/area-map',
      'en': '/en/features/area-map',
      'vi': '/vi/features/area-map',
      'zh': '/zh/features/area-map'
    }
  }
};

export default function AreaMapFeatureLandingPageZH() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      <LanguageBanner />
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-rose-50/50 dark:from-rose-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-sm font-semibold mb-6 shadow-sm border border-rose-100 dark:border-rose-800/50">
          <Sparkles className="w-4 h-4" /> 提前规避投资风险
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          在一张地图上<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500 dark:from-rose-400 dark:to-orange-300">揭开法拍房的“隐藏风险”。</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          在出价前必须确认的“灾害风险地图（洪水、山体滑坡、海啸）”与“城市规划（用途地域、建蔽率、容积率）”。通过 Keibai Finder，您可以直接调用日本政府的庞大开放数据，一切仅需一键操作。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/area-map"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-rose-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-rose-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <Layers className="w-5 h-5" /> 立即分析区域
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
                国家级灾害数据无缝对接，为您保驾护航
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                无需再翻阅繁杂的政府网站。系统以服务器级别直连日本国土地理院的“灾害信息门户网站 (Disaportal)”，为您快速且直观地渲染多层风险地图。
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  自动叠加洪水、泥石流、海啸以及风暴潮四大风险层。
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  系统将通过 AI 自动计算定位点到最近的指定避难所的直线距离及步行时间。
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8 flex flex-col gap-4">
               <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-red-700 dark:text-red-400">
                    <span className="text-lg">🌊</span> 洪水 (Flood)
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">预计水深: 3.0米以下</div>
               </div>
               <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-orange-700 dark:text-orange-400">
                    <span className="text-lg">⛰️</span> 滑坡及泥石流风险
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">警戒区域 (Yellow Zone)</div>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="text-lg">🏕</span> 指定紧急避难所
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">○○小学 (步行约6分钟)</div>
               </div>
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
                  <Building2 className="w-5 h-5 text-blue-500" /> 城市规划数据
                </h3>
              </div>
              <div className="space-y-6">
                 <div>
                   <p className="text-sm text-zinc-500 mb-1">土地用途类型 (用途地域)</p>
                   <p className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center justify-between">
                     第一种居住地域
                   </p>
                 </div>
                 <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-medium text-zinc-500">建蔽率 (建筑占地比例)</p>
                     <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">60%</p>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-zinc-500">容积率 (总建筑面积比例)</p>
                     <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">200%</p>
                   </div>
                 </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                一键点击，轻松掌握<br/>所有建筑限制要求。
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                土地的真实价值由其可建什么样规模的房屋决定。与其在日本政府繁杂晦涩的网站上苦苦搜寻政策指标，不如来利用我们的便捷工具。
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                通过 Keibai Finder 的规划图层，只需在地图上将目标地点点击锁定，系统便会自动从日本国土交通省(MLIT)直接拉取该地块的性质、建蔽率及容积率，并通过优雅的高亮透明框准确标出地块范围！
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
