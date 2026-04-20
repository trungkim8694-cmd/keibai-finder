'use client';

import React, { useState } from 'react';
import { MlitTransaction } from '@/lib/mlitApi';

interface TradeListProps {
  transactions: MlitTransaction[];
}

export default function TradeList({ transactions }: TradeListProps) {
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / perPage);
  const currentTransactions = transactions.slice((page - 1) * perPage, page * perPage);

  const formatPrice = (p: string | undefined) => {
    if (!p) return '-';
    return `${Math.round(Number(p) / 10000).toLocaleString('ja-JP')}万円`;
  };

  const getCategoryBadge = (mlitType: string | undefined) => {
    if (!mlitType) return <span className="text-xs px-2 py-1 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700">不明</span>;
    if (mlitType.includes("マンション")) return <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">マンション</span>;
    if (mlitType.includes("建物")) return <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800">戸建て</span>;
    return <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">土地</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal">
           <thead>
             <tr className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                <th className="font-semibold py-3 px-2 w-28">取引時期</th>
                <th className="font-semibold py-3 px-2 w-24">種別</th>
                <th className="font-semibold py-3 px-2">物件詳細</th>
                <th className="font-semibold py-3 px-2 text-right">取引価格</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
             {currentTransactions.map((t, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                   
                   <td className="py-4 px-2 align-top text-zinc-500 dark:text-zinc-400 font-medium">
                     {t.Period || '-'}
                   </td>

                   <td className="py-4 px-2 align-top">
                     {getCategoryBadge(t.Type)}
                   </td>
                   
                   <td className="py-4 px-2 align-top min-w-[200px]">
                     <div className="text-base font-bold text-blue-700 dark:text-blue-400 mb-1">
                        {t.Prefecture || ''}{t.Municipality || ''}{t.DistrictName || ''} <span className="text-sm font-normal text-zinc-500 ml-1">{t.Type || ''}</span>
                     </div>
                     <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {t.FloorPlan && <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{t.FloorPlan}</span>}
                        {t.BuildingYear && <span>築年: {t.BuildingYear}</span>}
                        {t.Area && <span className="font-semibold px-2">面積: {t.Area}㎡</span>}
                        {t.Structure && <span>構造: {t.Structure}</span>}
                     </div>
                   </td>
                   
                   <td className="py-4 px-2 align-top text-right">
                     <span className="text-lg font-black text-zinc-900 dark:text-white">
                       {formatPrice(t.TradePrice)}
                     </span>
                     {t.Area && t.TradePrice && (
                       <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                         {Math.round(Number(t.TradePrice) / Number(t.Area) / 10000).toLocaleString('ja-JP')}万円/㎡
                       </div>
                     )}
                   </td>
                </tr>
             ))}
           </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
           <button 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1}
             className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold disabled:opacity-50"
           >
             前へ
           </button>
           <div className="px-4 py-2 text-sm text-zinc-500 flex items-center">
             {page} / {totalPages} ページ
           </div>
           <button 
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             disabled={page === totalPages}
             className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold disabled:opacity-50"
           >
             次へ
           </button>
        </div>
      )}
    </div>
  );
}
