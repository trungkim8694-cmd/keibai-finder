import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Layers, ArrowRight, Sparkles, AlertTriangle, Building2 } from 'lucide-react';
import LanguageBanner from '@/components/LanguageBanner';

export const metadata: Metadata = {
  title: 'Area Analysis Map (Hazards & Zoning) | Keibai Finder Features',
  description: 'The ultimate area analysis map integrating official data from the GSI and MLIT. Thoroughly investigate natural disaster risks and zoning regulations (FAR/Coverage) on a single screen before making your real estate investment.',
  alternates: {
    languages: {
      'ja': '/features/area-map',
      'en': '/en/features/area-map',
      'vi': '/vi/features/area-map',
      'zh': '/zh/features/area-map'
    }
  }
};

export default function AreaMapFeatureLandingPageEN() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      <LanguageBanner />
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-rose-50/50 dark:from-rose-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-sm font-semibold mb-6 shadow-sm border border-rose-100 dark:border-rose-800/50">
          <Sparkles className="w-4 h-4" /> Mitigate Investment Risks in Advance
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          Uncover the "Hidden Risks" of<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500 dark:from-rose-400 dark:to-orange-300">Foreclosure Properties with One Map.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          Hazard Maps (Flood, Landslide, Tsunami) and Urban Planning (Zoning, FAR, Coverage Ratio) are essential checks before any bid. Keibai Finder provides instant access to massive government datasets with a single tap.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/area-map"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-rose-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-rose-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <Layers className="w-5 h-5" /> Analyze an Area Now
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
                Direct GSI Integration: Hazard Maps that Protect Your Assets.
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Seamlessly integrated with the government's official disaster map system at the server level. You don't need to visit complex agency websites—our tool instantly paints high-speed disaster risk layers around your target property.
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  Overlays 4 major risk layers: Floods, Landslides, Tsunamis, and Storm Surges.
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  AI automatically calculates the straight-line distance and walking time to the nearest designated emergency shelter.
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8 flex flex-col gap-4">
               <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-red-700 dark:text-red-400">
                    <span className="text-lg">🌊</span> Flood
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">Inundation depth under 3.0m</div>
               </div>
               <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-orange-700 dark:text-orange-400">
                    <span className="text-lg">⛰️</span> Landslide
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">Warning Area (Yellow Zone)</div>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="text-lg">🏕</span> Emergency Shelter
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">Elementary School (approx. 6 mins walk)</div>
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
                  <Building2 className="w-5 h-5 text-blue-500" /> Urban Planning Data
                </h3>
              </div>
              <div className="space-y-6">
                 <div>
                   <p className="text-sm text-zinc-500 mb-1">Land Use Zone</p>
                   <p className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center justify-between">
                     Category 1 Residential
                   </p>
                 </div>
                 <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-medium text-zinc-500">Coverage Ratio</p>
                     <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">60%</p>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-zinc-500">FAR (Floor Area Ratio)</p>
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
                Expose FAR and Coverage Limits<br/>with Pinpoint Click Analysis.
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                A land's true asset value is determined by what you can build on it (Zoning Regulations). However, looking up this information on confusing local government websites is time-consuming.
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                With Keibai Finder's "Zoning Layer", simply click on any land plot you're interested in. The system instantly fetches the designated zoning type, Building Coverage Ratio, and Floor Area Ratio (FAR) from MLIT's official framework, highlighting the exact geometry.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
