import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Map, ArrowRight, TrendingUp, Sparkles, MapPin, Calculator, MousePointer2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Find Japan Property on Map. AI uncovers True Value.',
  description: 'Japan Keibai auction property map search & MLIT AI Valuation. Discover the true investment value.',
  alternates: {
    languages: {
      'ja': '/features/map-search',
      'en': '/en/features/map-search',
      'vi': '/vi/features/map-search',
      'zh': '/zh/features/map-search'
    }
  }
};

export default function MapFeatureLandingPageEN() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50/50 dark:from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-300 text-sm font-semibold mb-6 shadow-sm border border-blue-100 dark:border-indigo-800/50">
          <Sparkles className="w-4 h-4" /> Next Gen Real Estate Solution
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          Find Japan Property on Map.<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">AI uncovers True Value.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          With Keibai Finder, search Japan court auction and public properties visually on Google Maps. We reveal true investment potential using AI Gap Analysis.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Map className="w-5 h-5" /> Start Map Search
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
                Visually locate your properties in Japan
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Traditional lists can’t show surroundings. With Map Search, auction properties are pinned on map to easily see location, stations, and convenience.
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  Unified data of court and government properties.
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  View actual history prices visually on map.
                </li>
              </ul>
            </div>
            <Link href="/" className="relative rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 overflow-hidden aspect-video group block cursor-pointer">
              <div className="absolute inset-0 bg-blue-100/50 dark:bg-indigo-900/20 backdrop-blur-[2px] flex items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  <MousePointer2 className="w-4 h-4 animate-bounce" /> Click to move map
                </div>
              </div>
              <div className="w-full h-full bg-zinc-100 dark:bg-zinc-700 rounded-xl relative overflow-hidden">
                 <div className="absolute top-[20%] left-[30%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                    </span>
                    <div className="mt-1 bg-white dark:bg-zinc-900 text-xs font-bold px-2 py-0.5 rounded shadow-sm">1,250 Man-Yen</div>
                 </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Feature 2: MLIT Gap Analysis */}
      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center flex-col-reverse lg:flex-row-reverse">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" /> Market Price Gap
                  </h3>
                </div>
                <div className="space-y-6">
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">Estimated Market Value (MLIT Data)</p>
                     <p className="text-2xl font-black text-zinc-900 dark:text-white">Est. 2,850 <span className="text-base font-normal">Man-Yen</span></p>
                   </div>
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">Auction Base Price</p>
                     <p className="text-2xl font-black text-blue-600 dark:text-blue-400">1,420 <span className="text-base font-normal">Man-Yen</span></p>
                   </div>
                   <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                     <div className="flex items-center justify-between">
                       <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Gap Check</p>
                       <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
                         <TrendingUp className="w-4 h-4" /> +100.7% Undervalued
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
                Verify "True Value" using Government Data & AI
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                 While auction properties are expected to be cheap, calculating if it's truly a good deal is tough.
                 Keibai Finder uses MLIT (Ministry of Land) real estate sales data to estimate the actual market value of the property for you, instantly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
