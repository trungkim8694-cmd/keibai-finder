import React from 'react';
import { MlitTransaction } from '@/lib/mlitApi';
import { Map, Landmark } from 'lucide-react';

interface NearbyTransactionsProps {
  transactions: MlitTransaction[];
  prefecture: string;
  city: string;
  propertyType?: string;
}

export function NearbyTransactions({ transactions, prefecture, city, propertyType }: NearbyTransactionsProps) {
  if (!transactions || transactions.length === 0) return null;

  // Render up to 5 transactions, reversing it assuming the latest might be at the end or random.
  // Actually they are grouped by period, let's just pick top 5.
  const displayTrans = transactions.slice(0, 5);

  const formatPrice = (p: string | undefined) => {
    if (!p) return '-';
    // Mlit provides price as standard digits e.g. "45000000"
    const num = Number(p);
    return `${Math.round(num / 10000).toLocaleString('ja-JP')}万円`;
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <Map className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center gap-1.5">
          周辺の取引事例 ({city})
          {propertyType && <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md whitespace-nowrap">{propertyType}</span>}
        </h3>
        <span className="ml-auto text-xs font-semibold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full">
           MLIT API
        </span>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left">
           <thead>
             <tr className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                <th className="font-semibold py-2">地区</th>
                <th className="font-semibold py-2">面積</th>
                <th className="font-semibold py-2">建築年</th>
                <th className="font-semibold py-2 text-right">取引価格</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
             {displayTrans.map((t, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                   <td className="py-3 pr-2 text-zinc-800 dark:text-zinc-200 font-medium">
                     {t.DistrictName || '-'}
                     <div className="text-[10px] text-zinc-400 font-normal">{t.Period || ''}</div>
                   </td>
                   <td className="py-3 text-zinc-600 dark:text-zinc-400">
                     {t.Area ? `${t.Area}㎡` : '-'}
                   </td>
                   <td className="py-3 text-zinc-600 dark:text-zinc-400">
                     {t.BuildingYear || '-'}
                   </td>
                   <td className="py-3 text-right font-black text-zinc-900 dark:text-zinc-100">
                     {formatPrice(t.TradePrice)}
                   </td>
                </tr>
             ))}
           </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3">
        <a 
          href={`/trade/find?pref=${encodeURIComponent(prefecture)}&city=${encodeURIComponent(city)}${propertyType ? `&type=${encodeURIComponent(propertyType)}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow focus:ring-4 focus:ring-indigo-500/20"
        >
          全取引事例を見る ↗
        </a>
      </div>
    </section>
  );
}
