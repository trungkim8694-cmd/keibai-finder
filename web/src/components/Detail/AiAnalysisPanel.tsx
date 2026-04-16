'use client';

import React from 'react';
import { Sparkles, Wrench } from 'lucide-react';

export function AiAnalysisPanel() {
  return (
    <section className="mb-0 mt-8 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm relative">
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/40 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm">
        <h2 className="font-bold text-lg md:text-xl text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          🤖 AI 総合分析レポート
        </h2>
      </div>

      {/* Body: Under Construction */}
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-5 border border-indigo-200 dark:border-indigo-800/50 shadow-inner">
           <Wrench className="w-8 h-8 text-indigo-500 dark:text-indigo-400 opacity-80" />
        </div>
        <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-2">機能アップデート中</h3>
        <p className="text-indigo-700/80 dark:text-indigo-300/80 font-medium">
          機能は現在開発中です。<br />次期バージョンでアップデートされる予定です。
        </p>
      </div>
      
    </section>
  );
}

