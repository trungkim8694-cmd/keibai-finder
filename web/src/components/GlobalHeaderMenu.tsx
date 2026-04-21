"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Map, TrendingUp, Shield, MapPin, TramFront } from 'lucide-react';

export default function GlobalHeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] rounded-full transition-colors box-border border ${isOpen ? 'bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-600' : 'bg-white border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800'}`}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] w-72 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 overflow-y-auto max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-6">
            
            {/* Directories */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">ディレクトリ (Directories)</h4>
              <div className="flex flex-col gap-2">
                <Link 
                  href="/" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[12px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors font-medium border border-blue-100 dark:border-blue-900/30"
                >
                  <div className="w-5 h-5 rounded-md bg-white dark:bg-blue-800/50 flex items-center justify-center shrink-0">
                    <Map className="w-3 h-3 text-blue-500" />
                  </div>
                  日本全国の物件マップ検索
                </Link>

                <Link 
                  href="/search/area" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[12px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-lg transition-colors font-medium border border-rose-100 dark:border-rose-900/30"
                >
                  <div className="w-5 h-5 rounded-md bg-white dark:bg-rose-800/50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-rose-500" />
                  </div>
                  地域・エリアから探す
                </Link>
                
                <Link 
                  href="/search/station" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[12px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-lg transition-colors font-medium border border-emerald-100 dark:border-emerald-900/30"
                >
                  <div className="w-5 h-5 rounded-md bg-white dark:bg-emerald-800/50 flex items-center justify-center shrink-0">
                    <TramFront className="w-3 h-3 text-emerald-500" />
                  </div>
                  路線・駅から探す
                </Link>
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">ツール (Tools)</h4>
              <div className="flex flex-col gap-2">
                <Link href="/trade/find" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[12px] font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group p-1">
                  <div className="w-6 h-6 shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
                    <span className="text-[12px] opacity-80 group-hover:opacity-100">⚖️</span>
                  </div>
                  不動産取引価格検索 (MLIT)
                </Link>
                <Link href="/market-insights" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[12px] font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-1">
                  <div className="w-6 h-6 shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30">
                    <span className="text-[12px] opacity-80 group-hover:opacity-100">📈</span>
                  </div>
                  市場分析ダッシュボード
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">機能紹介 (FEATURES)</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Map className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  地図検索機能について
                </div>
                <div className="flex flex-wrap gap-1.5 pl-7">
                  <Link onClick={() => setIsOpen(false)} href="/features/map-search" className="text-[10px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">日本語</Link>
                  <Link onClick={() => setIsOpen(false)} href="/en/features/map-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">English</Link>
                  <Link onClick={() => setIsOpen(false)} href="/vi/features/map-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">Tiếng Việt</Link>
                  <Link onClick={() => setIsOpen(false)} href="/zh/features/map-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">中文</Link>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  価格査定機能について
                </div>
                <div className="flex flex-wrap gap-1.5 pl-7">
                  <Link onClick={() => setIsOpen(false)} href="/features/trade-price-search" className="text-[10px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">日本語</Link>
                  <Link onClick={() => setIsOpen(false)} href="/en/features/trade-price-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">English</Link>
                  <Link onClick={() => setIsOpen(false)} href="/vi/features/trade-price-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">Tiếng Việt</Link>
                  <Link onClick={() => setIsOpen(false)} href="/zh/features/trade-price-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">中文</Link>
                </div>
              </div>
            </div>

            {/* Legal */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-2">
              <div className="flex gap-4 text-[11px]">
                <Link onClick={() => setIsOpen(false)} href="/terms" className="flex items-center gap-1 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300"><Shield className="w-3 h-3" /> 利用規約</Link>
                <Link onClick={() => setIsOpen(false)} href="/privacy" className="hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300">プライバシー</Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
