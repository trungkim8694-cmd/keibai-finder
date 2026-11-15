'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Map } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for production diagnostics
    console.error('Unhandled App Router Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 py-16 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            システムエラーが発生しました
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            一時的な通信エラーまたはデータ取得エラーが発生しました。再読み込みをお試しいただくか、トップページへお戻りください。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#163e6c] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            もう一度試す
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            トップへ戻る
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            マップへ
          </Link>
        </div>
      </div>
    </div>
  );
}
