import React from 'react';
import Link from 'next/link';
import { Map, TrendingUp, Shield, Globe } from 'lucide-react';

export default function SidebarFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-8 pt-6 pb-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-500">
      
      {/* 1. Internal linking for Features */}
      <div className="mb-6 space-y-3 px-2">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">機能紹介 (Features)</h4>
        <Link href="/features/map-search" className="flex items-center gap-2 text-[12px] font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
            <Map className="w-3.5 h-3.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </div>
          日本全国の不動産を地図で探す
        </Link>
        <Link href="/features/trade-price-search" className="flex items-center gap-2 text-[12px] font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30">
            <TrendingUp className="w-3.5 h-3.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
          </div>
          過去の不動産取引相場を査定
        </Link>
      </div>

      {/* 2. SEO Links for Areas (Top 4 most searched prefectures) */}
      <div className="mb-6 px-2">
         <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">主要エリア (Areas)</h4>
         <div className="flex flex-wrap gap-2">
            {['東京都', '大阪府', '北海道', '福岡県'].map((pref) => (
              <Link 
                key={pref} 
                href={`/search/area/${pref}`}
                className="text-[11px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 rounded-md transition-colors"
              >
                {pref}の物件
              </Link>
            ))}
         </div>
      </div>

      {/* 3. Global Languages for SEO */}
      <div className="mb-6 px-2">
         <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> 言語設定 (Languages)</h4>
         <div className="flex flex-wrap gap-2 text-[11px]">
            <Link href="/" className="hover:text-blue-500 hover:underline">日本語</Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Link href="/en/features/trade-price-search" className="hover:text-blue-500 hover:underline">English</Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Link href="/vi/features/trade-price-search" className="hover:text-blue-500 hover:underline">Tiếng Việt</Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Link href="/zh/features/trade-price-search" className="hover:text-blue-500 hover:underline">中文</Link>
         </div>
      </div>

      {/* 4. Copyright & Legal */}
      <div className="px-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-2">
         <div className="flex gap-4 text-[11px]">
           <span className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"><Shield className="w-3 h-3" /> 利用規約</span>
           <span className="hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer">プライバシー</span>
         </div>
         <div className="text-[10px] text-zinc-400 dark:text-zinc-600">
           © {currentYear} Keibai-Koubai Finder. All rights reserved. <br/>
           Data is sourced from BIT and MLIT.
         </div>
      </div>
    </div>
  );
}
