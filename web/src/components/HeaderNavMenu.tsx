'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Map, 
  MapPin, 
  Train, 
  TrendingUp, 
  Search, 
  Layers, 
  FileText, 
  Users, 
  ChevronDown, 
  Menu, 
  X,
  HelpCircle,
  BarChart3,
  Database,
  Flame,
  Calendar
} from 'lucide-react';

export default function HeaderNavMenu() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchMenuRef.current && !searchMenuRef.current.contains(e.target as Node) &&
        toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center">
      {/* DESKTOP NAVIGATION BAR */}
      <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
        {/* 1. Property Search Dropdown */}
        <div className="relative" ref={searchMenuRef}>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'search' ? null : 'search')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-colors ${
              openDropdown === 'search'
                ? 'bg-slate-100 dark:bg-zinc-800 text-[#1B4F8A] dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:text-[#1B4F8A]'
            }`}
          >
            <span>物件を探す</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'search' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'search' && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <Link
                href="/map"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <Map className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <div>
                  <p className="font-semibold">全国物件マップ</p>
                  <p className="text-[10px] text-slate-400">地図から直感的に探す</p>
                </div>
              </Link>
              <Link
                href="/search/area"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-semibold">地域・エリアから探す</p>
                  <p className="text-[10px] text-slate-400">47都道府県・市区町村</p>
                </div>
              </Link>
              <Link
                href="/search/station"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <Train className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="font-semibold">沿線・駅から探す</p>
                  <p className="text-[10px] text-slate-400">主要鉄道・駅徒歩圏内</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* 2. Market Analysis & Tools Dropdown */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'tools' ? null : 'tools')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-colors ${
              openDropdown === 'tools'
                ? 'bg-slate-100 dark:bg-zinc-800 text-[#1B4F8A] dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:text-[#1B4F8A]'
            }`}
          >
            <span>相場・分析ツール</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'tools' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'tools' && (
            <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <Link
                href="/auction-results"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A] border-b border-slate-100 dark:border-zinc-800/60 pb-2.5 mb-1"
              >
                <Database className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">落札結果データベース</p>
                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">DB</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">裁判所・公売の落札実績データ</p>
                </div>
              </Link>
              <Link
                href="/trade-find"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">国土交通省 取引価格検索</p>
                  <p className="text-[10px] text-slate-400 truncate">実勢相場との比較査定</p>
                </div>
              </Link>
              <Link
                href="/market-insights"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">市場分析ダッシュボード</p>
                  <p className="text-[10px] text-slate-400 truncate">需給動向と価格推移</p>
                </div>
              </Link>
              <Link
                href="/area-map"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <Layers className="w-4 h-4 text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">エリア分析・ハザードマップ</p>
                  <p className="text-[10px] text-slate-400 truncate">浸水・土砂災害・用途地域</p>
                </div>
              </Link>
              <Link
                href="/features/keyword-trends"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <Flame className="w-4 h-4 text-rose-500 shrink-0 fill-rose-500" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">検索需要トレンド分析</p>
                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">AI</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">急上昇キーワード & Agent連携</p>
                </div>
              </Link>
              <Link
                href="/extension"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-[#1B4F8A]"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                  <img src="/extension-icon.png" alt="Keibai Lens" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">Keibai Lens 拡張機能</p>
                  <p className="text-[10px] text-slate-400 truncate">BIT閲覧を強化するChrome拡張</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* 3. Direct Link to Auction Schedule Calendar */}
        <Link
          href="/auction/schedule"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:text-[#1B4F8A] transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>売却スケジュール</span>
        </Link>

        {/* 3. Real Estate Companies Directory Link */}
        <Link
          href="/agencies"
          className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:text-[#1B4F8A] transition-colors"
        >
          不動産会社を探す
        </Link>

        {/* 5. Guide / Blogs Link */}
        <Link
          href="/blogs"
          className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:text-[#1B4F8A] transition-colors"
        >
          ナレッジ & コラム
        </Link>
      </nav>

      {/* MOBILE HAMBURGER BUTTON */}
      <div className="lg:hidden ml-1">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
          aria-label="メニューを開く"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-[53px] bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-xl p-4 z-50 animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-2">物件を探す</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Link
                    href="/map"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1.5 p-2 rounded bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <Map className="w-3.5 h-3.5 text-[#1B4F8A]" />
                    <span>全国物件マップ</span>
                  </Link>
                  <Link
                    href="/search/area"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1.5 p-2 rounded bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-slate-200"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>地域から探す</span>
                  </Link>
                  <Link
                    href="/search/station"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1.5 p-2 rounded bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-slate-200"
                  >
                    <Train className="w-3.5 h-3.5 text-purple-600" />
                    <span>沿線・駅から探す</span>
                  </Link>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
                <p className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-2">相場・分析ツール</p>
                <div className="space-y-1.5">
                  <Link
                    href="/auction-results"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#1B4F8A]" />
                      <span>落札結果データベース</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-[#1B4F8A] dark:text-blue-300 font-bold">DB</span>
                  </Link>
                  <Link
                    href="/trade-find"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-1.5 hover:text-[#1B4F8A]"
                  >
                    不動産取引価格検索 (MLIT)
                  </Link>
                  <Link
                    href="/market-insights"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-1.5 hover:text-[#1B4F8A]"
                  >
                    市場分析ダッシュボード
                  </Link>
                  <Link
                    href="/area-map"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-1.5 hover:text-[#1B4F8A]"
                  >
                    エリア分析・ハザードマップ
                  </Link>
                  <Link
                    href="/features/keyword-trends"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-1.5 hover:text-[#1B4F8A]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>検索需要トレンド (AI連携)</span>
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300 font-bold">HOT</span>
                  </Link>
                  <Link
                    href="/extension"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-1.5 hover:text-[#1B4F8A]"
                  >
                    Keibai Lens 拡張機能
                  </Link>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
                <Link
                  href="/auction/schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 font-semibold border border-blue-200/60"
                >
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>売却スケジュール（カレンダー）</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 flex flex-col gap-2">
                <Link
                  href="/agencies"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-semibold text-slate-800 dark:text-slate-200"
                >
                  不動産会社を探す（宅建DB）
                </Link>
                <Link
                  href="/blogs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-semibold text-slate-800 dark:text-slate-200"
                >
                  ナレッジ & コラム
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

