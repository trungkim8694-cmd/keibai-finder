'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="relative rounded-full flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 transition-all duration-300 group shrink-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 outline-none focus:outline-none print:hidden" 
      title="印刷"
    >
      <Printer className="w-[16px] h-[16px] sm:w-[15px] sm:h-[15px] text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" strokeWidth={2.5} />
      <span className="hidden sm:inline text-xs font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">印刷</span>
    </button>
  );
}
