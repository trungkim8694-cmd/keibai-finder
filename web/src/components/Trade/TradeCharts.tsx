'use client';

import React, { useMemo } from 'react';
import { MlitTransaction } from '@/lib/mlitApi';
import { ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TradeChartsProps {
  transactions: MlitTransaction[];
  trendData?: { year: string, price: number, area: number }[];
  city: string;
  pref: string;
  propertyType: string;
}

export default function TradeCharts({ transactions, trendData = [], city, pref, propertyType }: TradeChartsProps) {
  
  // Transform Data for Scatter Chart (Area vs Price)
  const scatterData = useMemo(() => {
    return transactions
      .map(t => {
        // Area may contain text like "2000㎡以上". Clean it.
        const rawArea = parseInt((t.Area || '').replace(/\D/g, ''), 10);
        const priceYen = Number(t.TradePrice || 0);
        const priceMan = priceYen / 10000;
        return {
          originalContext: t,
          area: rawArea,
          priceMan: Math.round(priceMan)
        };
      })
      .filter(d => !isNaN(d.area) && d.area > 0 && d.priceMan > 0);
  }, [transactions]);

  if (transactions.length === 0) return null;

  // Calculate Average for Scatter Plot
  const avgArea = scatterData.length > 0 ? Math.round(scatterData.reduce((acc, curr) => acc + curr.area, 0) / scatterData.length) : 0;
  const avgPrice = scatterData.length > 0 ? Math.round(scatterData.reduce((acc, curr) => acc + curr.priceMan, 0) / scatterData.length) : 0;
  const avgSqmPrice = avgArea > 0 ? (avgPrice / avgArea).toFixed(1) : '0';

  // Calculate Latest Trend Data for Bar Chart
  const latestTrend = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const latestTrendPriceMan = latestTrend ? Math.round(latestTrend.price / 10000) : 0;
  const latestTrendArea = latestTrend ? Math.round(latestTrend.area) : 0;
  const latestTrendSqmPrice = latestTrendArea > 0 ? (latestTrend.price / 10000 / latestTrend.area).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 p-3 rounded shadow-lg border border-zinc-200 dark:border-zinc-700 text-sm">
           <p className="font-bold border-b border-zinc-100 dark:border-zinc-700 pb-1 mb-2">
             {data.originalContext.DistrictName}
           </p>
           <p className="flex justify-between gap-4"><span className="text-zinc-500">取引価格:</span> <span className="font-bold">{data.priceMan.toLocaleString('ja-JP')}万円</span></p>
           <p className="flex justify-between gap-4"><span className="text-zinc-500">面積:</span> <span className="font-bold">{data.area}㎡</span></p>
           <p className="flex justify-between gap-4"><span className="text-zinc-500">建築年:</span> <span className="font-bold">{data.originalContext.BuildingYear || '-'}</span></p>
        </div>
      );
    }
    return null;
  };

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
    <div className="flex flex-col gap-6">
      {/* Chart 1: 5-Year Trend */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              📊 {pref}{city} {propertyType}の地価推移 (直近5年)
            </h3>
          </div>
          <div className="p-4 sm:p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
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
             <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={trendData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
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
        </div>
      )}

      {/* Chart 2: Transaction Scatter Plot */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-200 dark:border-zinc-800">
           <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
             🎯 {pref}{city} {propertyType}の取引履歴
           </h3>
        </div>
        
        <div className="p-4 sm:p-6">
           <div className="mb-6">
              <p className="text-xs text-zinc-500 mb-1 font-bold">取引平均価格 / 平均面積 (単価) (2023)</p>
              <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black">{avgPrice.toLocaleString('ja-JP')}</span>
                 <span className="text-sm font-bold text-zinc-500 mr-2">万円</span>
                 <span className="text-xl font-bold">/ {avgArea}㎡</span>
                 <span className="text-sm font-bold text-zinc-500 ml-1">({avgSqmPrice}万円/㎡)</span>
              </div>
           </div>

           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                   <XAxis 
                      type="number" 
                      dataKey="area" 
                      name="面積" 
                      unit="㎡" 
                      tick={{ fill: '#9ca3af', fontSize: 11 }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={['auto', 'auto']}
                   />
                   <YAxis 
                      type="number" 
                      dataKey="priceMan" 
                      name="価格" 
                      tick={{ fill: '#9ca3af', fontSize: 11 }} 
                      tickFormatter={(val) => `${val.toLocaleString()}万`}
                      axisLine={false} 
                      tickLine={false} 
                      width={60}
                   />
                   <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                   <Scatter name="取引実績" data={scatterData} fill="#8b5cf6" fillOpacity={0.6} />
                 </ScatterChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
