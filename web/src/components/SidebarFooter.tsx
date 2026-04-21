import React from 'react';
import Link from 'next/link';
import { Map, TrendingUp, Shield, Globe } from 'lucide-react';

export default function SidebarFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-8 pt-6 pb-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-500">
      
      {/* 0. Internal linking for Tools (NEW) */}
      <div className="mb-6 space-y-3 px-2">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">ツール (Tools)</h4>
        <Link href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30">
            <span className="text-[12px] opacity-80 group-hover:opacity-100">🗺️</span>
          </div>
          日本全国の物件マップ検索
        </Link>
        <Link href="/trade/find" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
            <span className="text-[12px] opacity-80 group-hover:opacity-100">⚖️</span>
          </div>
          不動産取引価格検索 (MLIT)
        </Link>
        <Link href="/market-insights" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30">
            <span className="text-[12px] opacity-80 group-hover:opacity-100">📈</span>
          </div>
          市場分析ダッシュボード
        </Link>
      </div>

      {/* 1. Internal linking for PR Features (Matrix Design) */}
      <div className="mb-6 space-y-4 px-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">機能紹介 (FEATURES & LANGUAGES)</h4>
        
        {/* Map Search PR */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
            <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Map className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            地図検索機能について
          </div>
          <div className="flex gap-2 pl-7">
            <Link href="/features/map-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded transition-colors">日本語</Link>
            <Link href="/en/features/map-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">English</Link>
            <Link href="/vi/features/map-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">Tiếng Việt</Link>
            <Link href="/zh/features/map-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">中文</Link>
          </div>
        </div>

        {/* Trade Price PR */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
            <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            </div>
            価格査定機能について
          </div>
          <div className="flex gap-2 pl-7">
            <Link href="/features/trade-price-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded transition-colors">日本語</Link>
            <Link href="/en/features/trade-price-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">English</Link>
            <Link href="/vi/features/trade-price-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">Tiếng Việt</Link>
            <Link href="/zh/features/trade-price-search" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">中文</Link>
          </div>
        </div>
      </div>

      {/* 2. SEO Links for Areas (Top 4 most searched prefectures) */}
      <div className="mb-6 px-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
         <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">主要エリア (Areas)</h4>
         <div className="flex flex-wrap gap-2">
            {['東京都', '大阪府', '北海道', '福岡県'].map((pref) => (
              <Link 
                key={pref} 
                href={`/search/area/${pref}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[11px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 rounded-md transition-colors"
              >
                {pref}の物件
              </Link>
            ))}
         </div>
      </div>

      {/* 3. Copyright & Legal */}
      <div className="px-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-2">
         <div className="flex gap-4 text-[11px]">
           <Link href="/terms" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"><Shield className="w-3 h-3" /> 利用規約</Link>
           <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">プライバシー</Link>
         </div>
         <div className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">
           © {currentYear} Keibai-Koubai Finder. All rights reserved. <br/>
           Data is sourced from BIT and MLIT.
         </div>
      </div>
    </div>
  );
}
