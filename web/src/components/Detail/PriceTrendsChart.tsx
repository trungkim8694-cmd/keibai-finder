'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ExternalLink, Layers } from 'lucide-react';

interface PriceTrendsChartProps {
  data: { 
    year: string; 
    price: number; 
    area?: number;
    pricePerSqm?: number;
    count?: number;
  }[];
  city?: string;
  prefecture?: string;
  propertyType?: string;
}

export function PriceTrendsChart({ data, city, prefecture, propertyType }: PriceTrendsChartProps) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [viewMode, setViewMode] = useState<'sqm' | 'total'>('sqm');

  if (!data || data.length === 0) {
    return (
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800">
           <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
             <TrendingUp className="w-3.5 h-3.5 text-[#1B4F8A]" />
             <span>{prefecture}{city} {propertyType}の取引価格・単価推移 (直近5年)</span>
           </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-xs">
           取引実績データがありません
        </div>
      </section>
    );
  }

  const latestTrend = data.length > 0 ? data[data.length - 1] : null;
  const latestTrendPriceMan = latestTrend ? Math.round(latestTrend.price / 10000) : 0;
  const latestTrendArea = latestTrend?.area ? Math.round(latestTrend.area) : 0;
  const latestTrendSqmPrice = latestTrend?.pricePerSqm 
    ? (latestTrend.pricePerSqm / 10000).toFixed(1)
    : (latestTrendArea > 0 ? (latestTrendPriceMan / latestTrendArea).toFixed(1) : '0');

  // Chart data formatting based on view mode
  const chartData = data.map(d => {
    const pMan = Math.round(d.price / 10000);
    const sqmMan = d.pricePerSqm 
      ? Math.round((d.pricePerSqm / 10000) * 10) / 10
      : (d.area && d.area > 0 ? Math.round((pMan / d.area) * 10) / 10 : 0);

    return {
      year: d.year,
      displayVal: viewMode === 'sqm' ? sqmMan : pMan,
      totalPriceMan: pMan,
      sqmPriceMan: sqmMan,
      area: d.area ? Math.round(d.area) : null,
      count: d.count || null
    };
  });

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-md shadow-md border border-slate-200 dark:border-slate-800 text-xs font-sans space-y-1">
           <p className="font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-zinc-800 pb-1">
             {label}年 取引実績
           </p>
           <p className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
             <span>平均㎡単価:</span>
             <span className="font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">{item.sqmPriceMan.toLocaleString('ja-JP')}万円/㎡</span>
           </p>
           <p className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
             <span>平均取引総額:</span>
             <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{item.totalPriceMan.toLocaleString('ja-JP')}万円</span>
           </p>
           {item.area && (
             <p className="flex justify-between gap-3 text-slate-400 text-[11px]">
               <span>平均面積:</span>
               <span className="tabular-nums">{item.area}㎡</span>
             </p>
           )}
           {item.count && (
             <p className="flex justify-between gap-3 text-slate-400 text-[11px]">
               <span>取引件数:</span>
               <span className="tabular-nums">{item.count}件</span>
             </p>
           )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
         <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2 truncate">
           <TrendingUp className="w-3.5 h-3.5 text-[#1B4F8A] shrink-0" />
           <span className="truncate">{prefecture}{city} {propertyType}の取引相場推移</span>
         </h3>
         
         {/* Toggle View Mode */}
         <div className="inline-flex rounded-md p-0.5 bg-slate-200/70 dark:bg-zinc-800 text-[10px] font-semibold shrink-0">
           <button
             type="button"
             onClick={() => setViewMode('sqm')}
             className={`px-2 py-0.5 rounded transition-colors ${
               viewMode === 'sqm' 
                 ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-300 shadow-2xs' 
                 : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
             }`}
           >
             ㎡単価
           </button>
           <button
             type="button"
             onClick={() => setViewMode('total')}
             className={`px-2 py-0.5 rounded transition-colors ${
               viewMode === 'total' 
                 ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-300 shadow-2xs' 
                 : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
             }`}
           >
             総額
           </button>
         </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
         {latestTrend && (
            <div className="mb-3">
               <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                 {viewMode === 'sqm' ? '直近平均㎡単価' : '直近平均取引総額'} ({latestTrend.year}年)
               </p>
               <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {viewMode === 'sqm' ? latestTrendSqmPrice : latestTrendPriceMan.toLocaleString('ja-JP')}
                  </span>
                  <span className="text-xs text-slate-500 mr-2">
                    {viewMode === 'sqm' ? '万円/㎡' : '万円'}
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    （平均 {latestTrendArea}㎡ / 総額 {latestTrendPriceMan.toLocaleString('ja-JP')}万円）
                  </span>
               </div>
            </div>
         )}
         <div className="h-56 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                   <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#64748b', fontSize: 11 }} 
                      axisLine={false} 
                      tickLine={false} 
                   />
                   <YAxis 
                      tick={{ fill: '#64748b', fontSize: 11 }} 
                      tickFormatter={(val) => {
                        if (viewMode === 'sqm') return `${val}万`;
                        if (val >= 10000) return `${(val / 10000).toFixed(1)}億`;
                        return `${val.toLocaleString('ja-JP')}万`;
                      }}
                      axisLine={false} 
                      tickLine={false} 
                      width={58}
                   />
                   <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                   <Bar dataKey="displayVal" fill="#1B4F8A" radius={[3, 3, 0, 0]} maxBarSize={36} />
                 </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400">
                グラフ読み込み中...
              </div>
            )}
         </div>
      </div>
      <div className="p-2.5 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-right">
        <a 
          href="https://www.reinfolib.mlit.go.jp/landPrices/" 
          target="_blank" 
          rel="nofollow noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-600 transition-colors"
        >
          出典: 国土交通省 不動産情報ライブラリ（実取引データ）
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </section>
  );
}
