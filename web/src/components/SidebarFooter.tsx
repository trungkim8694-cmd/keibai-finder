import React from 'react';
import Link from 'next/link';
import { Map, TrendingUp, Shield, MapPin, TramFront, Layers } from 'lucide-react';

export default function SidebarFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-8 pt-6 pb-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-500">
      
      {/* 1. SEO Links for Areas & Stations (Silo Directories Gateways) - MOVED TO TOP */}
      <div className="mb-6 space-y-3 px-2">
         <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">ディレクトリ (Directories)</h4>
         <div className="flex flex-col gap-2">
            <Link 
              href="/"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors font-medium border border-blue-100 dark:border-blue-900/30"
            >
              <div className="w-5 h-5 rounded-md bg-white dark:bg-blue-800/50 flex items-center justify-center">
                <Map className="w-3 h-3 text-blue-500" />
              </div>
              日本全国の物件マップ検索
            </Link>

            <Link 
              href="/search/area"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-lg transition-colors font-medium border border-rose-100 dark:border-rose-900/30"
            >
              <div className="w-5 h-5 rounded-md bg-white dark:bg-rose-800/50 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-rose-500" />
              </div>
              地域・エリアから探す
            </Link>
            
            <Link 
              href="/search/station"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-lg transition-colors font-medium border border-emerald-100 dark:border-emerald-900/30"
            >
              <div className="w-5 h-5 rounded-md bg-white dark:bg-emerald-800/50 flex items-center justify-center">
                <TramFront className="w-3 h-3 text-emerald-500" />
              </div>
              路線・駅から探す
            </Link>
         </div>
      </div>

      {/* 2. Internal linking for Tools */}
      <div className="mb-6 space-y-3 px-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">ツール (Tools)</h4>

        <Link href="/extension" className="flex items-center gap-2 text-[12px] font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group mb-3">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30">
            <img src="/extension-icon.png" alt="Keibai Lens" className="w-4 h-4 rounded-[4px] opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          Keibai Lens 拡張機能
        </Link>

        <Link href="/trade-find" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
            <span className="text-[12px] opacity-80 group-hover:opacity-100">⚖️</span>
          </div>
          不動産取引価格検索 (MLIT)
        </Link>
        <Link href="/area-map" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-medium hover:text-rose-600 dark:hover:text-rose-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-900/30">
            <span className="text-[12px] opacity-80 group-hover:opacity-100">🌋</span>
          </div>
          エリア分析マップ (災害・都市計画)
        </Link>
        <Link href="/market-insights" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30">
            <span className="text-[12px] opacity-80 group-hover:opacity-100">📈</span>
          </div>
          市場分析ダッシュボード
        </Link>
      </div>

      {/* 3. Internal linking for PR Features (Matrix Design) */}
      <div className="mb-6 space-y-4 px-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
        <Link href="/features" className="flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-zinc-400 hover:text-indigo-600 dark:text-zinc-600 dark:hover:text-indigo-400 mb-2 transition-colors">機能紹介 (FEATURES & LANGUAGES) <span>→</span></Link>
        {/* Keibai Lens PR */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
            <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
              <img src="/extension-icon.png" alt="Keibai Lens" className="w-3.5 h-3.5 rounded-[3px] opacity-90" />
            </div>
            Keibai Lens 拡張機能について
          </div>
          <div className="flex gap-2 pl-7 flex-wrap">
            <Link href="/extension" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded transition-colors">日本語</Link>
            <Link href="/en/extension" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">English</Link>
            <Link href="/vi/extension" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">Tiếng Việt</Link>
            <Link href="/zh/extension" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">中文</Link>
          </div>
        </div>

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

        {/* Area Map PR */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
            <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Layers className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            </div>
            エリア分析マップについて
          </div>
          <div className="flex gap-2 pl-7">
            <Link href="/features/area-map" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-800/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded transition-colors">日本語</Link>
            <Link href="/en/features/area-map" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">English</Link>
            <Link href="/vi/features/area-map" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">Tiếng Việt</Link>
            <Link href="/zh/features/area-map" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors">中文</Link>
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

      {/* 4. Market Insights (Daily Digest static links for SEO) */}
      <div className="mb-6 space-y-3 px-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-600 mb-2">🔥 今日の掘り出し物 (INSIGHTS)</h4>
        
        <Link href="/insights" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30">
            <span className="text-[12px] opacity-80 group-hover:opacity-100">📰</span>
          </div>
          <span className="line-clamp-1">すべての市場レポートを見る</span>
        </Link>
      </div>

      {/* 5. Copyright & Legal */}
      <div className="px-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-2">
         <div className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium leading-relaxed">
           日本Office: 東京都豊島区<br/>
           Email: <a href="mailto:info@keibai-koubai.com" className="hover:text-blue-600 transition-colors">info@keibai-koubai.com</a>
         </div>
         <div className="flex gap-4 text-[11px] mt-1">
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
