import React from 'react';
import Link from 'next/link';

export default function SidebarFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-8 pt-4 pb-6 px-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-2 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-slate-300 font-medium">
        <span>運営会社: TQC株式会社</span>
        <div className="flex items-center gap-2">
          <Link href="/company" className="hover:text-blue-600 transition-colors">会社概要</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600 transition-colors">利用規約</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors">プライバシー</Link>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
        データ出典: 最高裁判所（BIT）・国税庁（NTA）・国土交通省（MLIT）
      </p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        © {currentYear} TQC Corporation / Keibai-Koubai Finder. All rights reserved.
      </p>
    </div>
  );
}
