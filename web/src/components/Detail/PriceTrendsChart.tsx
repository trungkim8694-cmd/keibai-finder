'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceTrendsChartProps {
  data: { year: string; price: number; area?: number }[];
  city?: string;
  prefecture?: string;
  propertyType?: string;
}

export function PriceTrendsChart({ data, city, prefecture, propertyType }: PriceTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-200 dark:border-zinc-800">
           <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
             📊 {prefecture}{city} {propertyType}の地価推移 (直近5年)
           </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-zinc-400 text-sm">
           データがありません
        </div>
      </section>
    );
  }

  const latestTrend = data.length > 0 ? data[data.length - 1] : null;
  const latestTrendPriceMan = latestTrend ? Math.round(latestTrend.price / 10000) : 0;
  const latestTrendArea = latestTrend?.area ? Math.round(latestTrend.area) : 0;
  const latestTrendSqmPrice = latestTrendArea > 0 ? (latestTrendPriceMan / latestTrendArea).toFixed(1) : '0';

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-800 p-2 rounded shadow-lg border border-zinc-200 dark:border-zinc-700 text-sm">
           <p className="font-bold text-zinc-900 dark:text-zinc-100">{label}年</p>
           <p className="text-blue-600 dark:text-blue-400 font-bold">
             {Math.round(payload[0].value / 10000).toLocaleString('ja-JP')}万円
           </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-200 dark:border-zinc-800">
         <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
           📊 {prefecture}{city} {propertyType}の地価推移 (直近5年)
         </h3>
      </div>
      
      <div className="p-4 sm:p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex-1 flex flex-col">
         {latestTrend && (
            <div className="mb-4">
               <p className="text-xs text-zinc-500 mb-1 font-bold">最新取引平均価格 / 平均面積 (単価) ({latestTrend.year})</p>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{latestTrendPriceMan.toLocaleString('ja-JP')}</span>
                  <span className="text-sm font-bold text-zinc-500 mr-2">万円</span>
                  <span className="text-xl font-bold">/ {latestTrendArea}㎡</span>
                  <span className="text-sm font-bold text-zinc-500 ml-1">({latestTrendSqmPrice}万円/㎡)</span>
               </div>
            </div>
         )}
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                 <XAxis 
                    dataKey="year" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                 />
                 <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 11 }} 
                    tickFormatter={(val) => `${Math.round(val / 10000).toLocaleString()}`}
                    axisLine={false} 
                    tickLine={false} 
                    width={60}
                 />
                 <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'transparent' }} />
                 <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-800 text-right">
        <a 
          href="https://www.reinfolib.mlit.go.jp/landPrices/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          出典：国土交通省地価公示
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </section>
  );
}
