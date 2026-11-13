'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { PreviewProperty } from './HomeMapPreviewInner';
import { Map, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HomeMapPreviewProps {
  properties: PreviewProperty[];
}

const HomeMapPreviewInner = dynamic(() => import('./HomeMapPreviewInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] sm:h-[460px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/60 flex flex-col items-center justify-center gap-3 animate-pulse">
      <div className="p-3 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-400">
        <Map className="w-6 h-6 animate-spin" />
      </div>
      <span className="text-xs font-bold text-slate-500">地図データを読み込み中...</span>
    </div>
  ),
});

export default function HomeMapPreview({ properties }: HomeMapPreviewProps) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 p-5 sm:p-7 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/80 dark:text-blue-300">
              Interactive Map
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              全国の競売・公売マップ
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            日本全国で公示中の競売・公売物件を地図上で直感的にリサーチ。気になるエリアをクリックして全画面マップへシームレスに移動できます。
          </p>
        </div>

        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 hover:underline shrink-0"
        >
          <span>全画面マップを開く</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Interactive Map Component */}
      <HomeMapPreviewInner properties={properties} />
    </section>
  );
}
