import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  MapPin,
  Train,
  Map,
  Calendar,
  Database,
  BookOpen,
  ArrowRight,
  Home,
  Search,
  AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '404 - ページが見つかりませんでした | Keibai Finder',
  description: 'お探しのページは、競売・公売の入札終了、取り下げ、またはURLの変更により存在しない可能性があります。',
  robots: {
    index: false,
    follow: true,
  },
};

const DATA_HUBS = [
  {
    title: '全国物件マップ検索',
    desc: '日本全国の競売・公売物件を地図上で直感的に検索・相場比較',
    href: '/map',
    icon: Map,
    badge: 'リアルタイム',
  },
  {
    title: '地域・都道府県から探す',
    desc: '47都道府県・市区町村別の公示物件一覧と相場データ',
    href: '/search/area',
    icon: MapPin,
    badge: '全国47都道府県',
  },
  {
    title: '沿線・駅から探す',
    desc: '主要鉄道沿線および最寄駅からの徒歩圏・アクセス別検索',
    href: '/search/station',
    icon: Train,
    badge: '駅徒歩検索',
  },
  {
    title: '売却スケジュールカレンダー',
    desc: '地方裁判所・税務署の入札期間・開札日・最新公示日程一覧',
    href: '/auction/schedule',
    icon: Calendar,
    badge: '日程一覧',
  },
  {
    title: '全国落札結果データベース',
    desc: '過去の競売落札価格・落札倍率・入札件数の統計アーカイブ',
    href: '/auction-results',
    icon: Database,
    badge: '相場アーカイブ',
  },
  {
    title: '競売・公売コラム & ナレッジ',
    desc: '入札手順・法的リスク・3点セットの読み方・立ち退き実務',
    href: '/blogs',
    icon: BookOpen,
    badge: '実務解説',
  },
];

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>HTTP 404 NOT FOUND</span>
        </div>

        {/* Header Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ページが見つかりませんでした
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            指定されたURLの物件は、入札期間の終了・落札に伴うアーカイブ移行、または取り下げにより公開を終了した可能性があります。下記の主要データハブより再度お探しください。
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4F8A] hover:bg-[#163e6c] text-white text-sm font-bold shadow-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            トップページへ戻る
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200 text-sm font-bold shadow-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            地図から現在入札可能な物件を探す
          </Link>
        </div>

        {/* Data Hub Grid */}
        <div className="pt-6 text-left">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 text-center">
            主要データハブから再検索
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DATA_HUBS.map((hub) => {
              const Icon = hub.icon;
              return (
                <Link
                  key={hub.href}
                  href={hub.href}
                  className="group block p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-[#1B4F8A] dark:hover:border-sky-500 rounded-xl shadow-xs transition-all hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[#1B4F8A] dark:text-sky-400 group-hover:bg-[#1B4F8A]/10 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-sky-400 truncate transition-colors">
                          {hub.title}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {hub.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
