import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Search, TrendingUp, Sparkles, Building2, ShieldCheck, JapaneseYen, ArrowRight, MousePointer2 } from 'lucide-react';
import LanguageBanner from '@/components/LanguageBanner';

export const metadata: Metadata = {
  title: 'Japan Property Trade Price Search | MLIT Official Data Valuation',
  description: 'Instantly search and evaluate Japan real estate prices using 5 years of official transaction history collected by MLIT. Discover the true market value.',
  alternates: {
    languages: {
      'ja': '/features/trade-price-search',
      'en': '/en/features/trade-price-search',
      'vi': '/vi/features/trade-price-search',
      'zh': '/zh/features/trade-price-search'
    }
  }
};

export default function TradePriceFeatureLandingPageEN() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/70 dark:from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
          <Sparkles className="w-4 h-4" /> Professional Valuation for Everyone
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          Find the True Value of <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Japan Real Estate.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          Don't rely on inflated agency asking prices. We use raw, official transaction data collected by MLIT (Japan Government) over 5 years so you can estimate real property value instantly.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/trade/find"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Search className="w-5 h-5" /> Start Free Search
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
                Is that price really fair?
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Listed prices on portals are just "wished prices." To invest safely in Japanese auctions or general real estate, you must know what similar properties *actually sold for* in that neighborhood.
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ShieldCheck className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  <p><strong>Official Backing:</strong> Directly streams "Real Estate Transaction Price Information" from the Ministry of Land (MLIT).</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  <p><strong>Visualize Trends:</strong> View recent years' historical price changes per square meter.</p>
                </li>
              </ul>
            </div>
            
            <Link href="/trade/find" className="relative rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 overflow-hidden aspect-video group block cursor-pointer">
              <div className="absolute inset-0 bg-blue-100/30 dark:bg-indigo-900/20 backdrop-blur-[1px] flex items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  <MousePointer2 className="w-4 h-4 animate-bounce" /> Click to open Search Tool
                </div>
              </div>
              <img src="/trade-price-search.webp" alt="Trade Price Search UI" className="w-full h-full object-cover rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-10 border border-indigo-100 dark:border-indigo-800/30">
          <JapaneseYen className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-4">The ultimate tool for Keibai Investors</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
            Knowing the "actual market price" clears the fog when setting your bid amount. Maximize your gap margin safely.
          </p>
          <Link
            href="/trade/find"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3.5 text-base font-bold shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all hover:scale-105"
          >
            Search Prices Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
