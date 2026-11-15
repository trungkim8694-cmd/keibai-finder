'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MlitTransaction } from '@/lib/mlitApi';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, Building, Calendar, Layers } from 'lucide-react';

interface NearbyTransactionsProps {
  transactions: MlitTransaction[];
  prefecture: string;
  city: string;
  propertyType?: string;
  currentBasePriceNum?: number;
  currentArea?: number | null;
}

export function NearbyTransactions({ 
  transactions, 
  prefecture, 
  city, 
  propertyType,
  currentBasePriceNum,
  currentArea
}: NearbyTransactionsProps) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!transactions || transactions.length === 0) return null;

  // Transform Data for Scatter Chart (Area vs Price)
  const scatterData = useMemo(() => {
    return transactions
      .map((t, idx) => {
        const rawArea = parseInt((t.Area || '').replace(/\D/g, ''), 10);
        const priceYen = Number(t.TradePrice || 0);
        const priceMan = priceYen / 10000;
        return {
          id: idx,
          isCurrent: false,
          originalContext: t,
          area: rawArea,
          priceMan: Math.round(priceMan),
          sqmPriceMan: rawArea > 0 ? (priceMan / rawArea).toFixed(1) : '-'
        };
      })
      .filter(d => !isNaN(d.area) && d.area > 0 && d.priceMan > 0);
  }, [transactions]);

  // If current property has area and price, add it to scatter points with special marker
  const combinedScatterData = useMemo(() => {
    const list = [...scatterData];
    if (currentBasePriceNum && currentBasePriceNum > 0 && currentArea && currentArea > 0) {
      const currentPriceMan = Math.round(currentBasePriceNum / 10000);
      const roundedArea = Math.round(currentArea);
      list.push({
        id: 99999,
        isCurrent: true,
        originalContext: {
          DistrictName: '★ 当物件（入札スタート価格）',
          BuildingYear: '-',
          Period: '公示中',
          TradePrice: String(currentBasePriceNum)
        } as any,
        area: roundedArea,
        priceMan: currentPriceMan,
        sqmPriceMan: (currentPriceMan / roundedArea).toFixed(1)
      });
    }
    return list;
  }, [scatterData, currentBasePriceNum, currentArea]);

  // Calculate Averages
  const avgArea = scatterData.length > 0 ? Math.round(scatterData.reduce((acc, curr) => acc + curr.area, 0) / scatterData.length) : 0;
  const avgPrice = scatterData.length > 0 ? Math.round(scatterData.reduce((acc, curr) => acc + curr.priceMan, 0) / scatterData.length) : 0;
  const avgSqmPrice = avgArea > 0 ? (avgPrice / avgArea).toFixed(1) : '0';

  // Representative 5 recent transactions
  const topRecentTransactions = useMemo(() => {
    return scatterData.slice(0, 5);
  }, [scatterData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 p-3 rounded-md shadow-md border border-slate-200 dark:border-zinc-700 text-xs font-sans space-y-1">
           <p className={`font-bold border-b pb-1 ${
             data.isCurrent 
               ? 'text-rose-600 dark:text-rose-400 border-rose-200' 
               : 'text-slate-900 dark:text-slate-100 border-slate-100 dark:border-zinc-700'
           }`}>
             {data.originalContext.DistrictName || '周辺成約物件'}
           </p>
           <p className="flex justify-between gap-4 text-slate-600 dark:text-slate-300">
             <span>取引価格:</span> 
             <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{data.priceMan.toLocaleString('ja-JP')}万円</span>
           </p>
           <p className="flex justify-between gap-4 text-slate-600 dark:text-slate-300">
             <span>面積:</span> 
             <span className="font-semibold tabular-nums">{data.area}㎡</span>
           </p>
           <p className="flex justify-between gap-4 text-slate-600 dark:text-slate-300">
             <span>㎡単価:</span> 
             <span className="font-semibold tabular-nums text-[#1B4F8A] dark:text-blue-400">{data.sqmPriceMan}万円/㎡</span>
           </p>
           {data.originalContext.BuildingYear && data.originalContext.BuildingYear !== '-' && (
             <p className="flex justify-between gap-4 text-slate-400 text-[11px]">
               <span>建築年:</span> 
               <span>{data.originalContext.BuildingYear}</span>
             </p>
           )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-lg shadow-none border border-slate-200 dark:border-zinc-800 h-full flex flex-col overflow-hidden">
      <div className="bg-slate-50/70 dark:bg-zinc-900/50 p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
         <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
           <Layers className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
           <span>{prefecture}{city} 近隣成約事例・取引相場実績</span>
         </h3>
         <span className="text-[10px] text-slate-500 bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded">
           {scatterData.length}件の成約データ
         </span>
      </div>

      <div className="p-4 sm:p-5 pb-4 border-b border-slate-100 dark:border-zinc-800 flex-1 flex flex-col">
         {/* Scatter Plot */}
         <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
           <span>成約面積と取引価格の分布（面積 vs 価格）</span>
           {currentBasePriceNum && currentArea && (
             <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
               <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
               赤丸: 当物件
             </span>
           )}
         </div>

         <div className="h-60 w-full mt-1">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-zinc-800" />
                   <XAxis 
                      type="number" 
                      dataKey="area" 
                      name="面積" 
                      unit="㎡" 
                      tick={{ fill: '#94a3b8', fontSize: 11 }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={['auto', 'auto']}
                   />
                   <YAxis 
                      type="number" 
                      dataKey="priceMan" 
                      name="価格" 
                      tick={{ fill: '#94a3b8', fontSize: 11 }} 
                      tickFormatter={(val) => {
                        if (val >= 10000) return `${(val / 10000).toFixed(1)}億`;
                        return `${val.toLocaleString('ja-JP')}万`;
                      }}
                      axisLine={false} 
                      tickLine={false} 
                      width={58}
                   />
                   <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                   <Scatter name="取引実績" data={combinedScatterData}>
                     {combinedScatterData.map((entry, index) => (
                       <Cell 
                         key={`cell-${index}`} 
                         fill={entry.isCurrent ? '#E11D48' : '#1B4F8A'} 
                         fillOpacity={entry.isCurrent ? 1 : 0.65}
                       />
                     ))}
                   </Scatter>
                 </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-slate-400">
                グラフ読み込み中...
              </div>
            )}
         </div>

         {/* 5 Representative Recent Transactions Table */}
         {topRecentTransactions.length > 0 && (
           <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
             <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
               近隣の主な成約事例（直近）
             </p>
             <div className="overflow-x-auto rounded border border-slate-200 dark:border-zinc-800">
               <table className="w-full text-[11px] text-left">
                 <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-zinc-800">
                   <tr>
                     <th className="px-2.5 py-1.5">地区</th>
                     <th className="px-2.5 py-1.5">取引時期</th>
                     <th className="px-2.5 py-1.5 text-right">面積</th>
                     <th className="px-2.5 py-1.5 text-right">取引価格</th>
                     <th className="px-2.5 py-1.5 text-right">㎡単価</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 tabular-nums">
                   {topRecentTransactions.map((item, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                       <td className="px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200">
                         {item.originalContext.DistrictName || '-'}
                       </td>
                       <td className="px-2.5 py-1.5 text-slate-500">
                         {item.originalContext.Period ? item.originalContext.Period.replace('年第', 'Q').replace('四半期', '') : '-'}
                       </td>
                       <td className="px-2.5 py-1.5 text-right text-slate-600 dark:text-slate-400">
                         {item.area}㎡
                       </td>
                       <td className="px-2.5 py-1.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                         {item.priceMan.toLocaleString('ja-JP')}万円
                       </td>
                       <td className="px-2.5 py-1.5 text-right font-semibold text-[#1B4F8A] dark:text-blue-400">
                         {item.sqmPriceMan}万
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}
      </div>
    </section>
  );
}
