'use client';

import { useState } from 'react';

type HistoryItem = {
  isCurrent: boolean;
  round: number;
  price: number;
  result: string;
  date: Date;
};

export function AuctionHistoryBadge({ history }: { history: HistoryItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!history || history.length <= 1) return null;

  const currentIdx = history.findIndex(h => h.isCurrent);
  const current = history[currentIdx] || history[history.length - 1];
  const previous = currentIdx > 0 ? history[currentIdx - 1] : null;

  const diff = previous && current ? previous.price - current.price : 0;
  const isDrop = diff > 0;
  const formattedDiff = new Intl.NumberFormat('ja-JP').format(Math.abs(diff / 10000)) + '万円';

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[11px] font-bold border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-[6px] py-[2px] rounded-sm shrink-0 inline-flex items-center leading-tight hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer shadow-sm active:scale-95"
      >
        <span className="mr-[2px]">🔄</span>
        <span>{history.length === 1 ? '(初)' : `(${history.length})`}</span>
        {isDrop && <span className="opacity-80 ml-1">↓降</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-100">過去の出品履歴</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">回数</th>
                    <th scope="col" className="px-4 py-3 font-semibold">価格</th>
                    <th scope="col" className="px-4 py-3 font-semibold">結果 / 期限</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {history.map((h, i) => (
                    <tr key={i} className={`${h.isCurrent ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-white dark:bg-zinc-900'}`}>
                      <td className={`px-4 py-3 ${h.isCurrent ? 'font-bold text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {h.round}回目 {h.isCurrent && '(今回)'}
                      </td>
                      <td className={`px-4 py-3 font-medium ${h.isCurrent ? 'text-red-700 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-500 line-through decoration-zinc-300 dark:decoration-zinc-700'}`}>
                        {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(h.price)}
                      </td>
                      <td className={`px-4 py-3 text-xs ${h.isCurrent ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-500 dark:text-zinc-500'}`}>
                        {h.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history.length > 3 && (
              <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-semibold text-center border-t border-red-100 dark:border-red-900/30">
                ⚠️ 注意: この物件は過去に何度も不売となっています。
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
