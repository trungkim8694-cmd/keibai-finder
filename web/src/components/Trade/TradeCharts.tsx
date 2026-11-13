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
  const latestTrendSqmPrice = latestTrend && latestTrendArea > 0 ? (latestTrend.price / 10000 / latestTrend.area).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#151B22] p-3 rounded-md shadow-md border border-slate-200 dark:border-slate-700 text-xs">
           <p className="font-bold border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 text-slate-900 dark:text-slate-100">
             {data.originalContext.DistrictName || '取引物件詳細'}
           </p>
           <div className="space-y-1 text-slate-600 dark:text-slate-300">
             <p className="flex justify-between gap-4">
               <span className="text-slate-500">取引価格:</span>
               <span className="font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">{data.priceMan.toLocaleString('ja-JP')}万円</span>
             </p>
             <p className="flex justify-between gap-4">
               <span className="text-slate-500">面積:</span>
               <span className="font-bold tabular-nums">{data.area}㎡</span>
             </p>
             <p className="flex justify-between gap-4">
               <span className="text-slate-500">建築年:</span>
               <span className="font-medium">{data.originalContext.BuildingYear || '-'}</span>
             </p>
           </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#151B22] p-2.5 rounded-md shadow-md border border-slate-200 dark:border-slate-700 text-xs">
           <p className="font-bold text-slate-900 dark:text-slate-100">{label}年</p>
           <p className="text-[#1B4F8A] dark:text-blue-400 font-bold tabular-nums mt-0.5">
             {Math.round(payload[0].value / 10000).toLocaleString('ja-JP')}万円
           </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Chart 1: 5-Year Trend */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs">
          <div className="bg-slate-50/75 dark:bg-[#0D1117]/60 p-3.5 border-b border-slate-200/90 dark:border-slate-800/90">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400"></span>
              <span>{pref}{city} {propertyType}の地価推移 (過去5年)</span>
            </h3>
          </div>
          <div className="p-4 sm:p-5 pb-2">
             {latestTrend && (
                <div className="mb-4">
                   <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                     最新取引平均価格 / 平均面積 (単価) ({latestTrend.year}年)
                   </p>
                   <div className="flex items-baseline gap-1 font-bold text-slate-900 dark:text-slate-100">
                      <span className="text-2xl font-bold tabular-nums text-[#1B4F8A] dark:text-blue-400">
                        {latestTrendPriceMan.toLocaleString('ja-JP')}
                      </span>
                      <span className="text-xs text-slate-500 mr-2">万円</span>
                      <span className="text-lg tabular-nums">/ {latestTrendArea}㎡</span>
                      <span className="text-xs text-slate-500 ml-1 tabular-nums">({latestTrendSqmPrice}万円/㎡)</span>
                   </div>
                </div>
             )}
             <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={trendData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                     <XAxis 
                        dataKey="year" 
                        tick={{ fill: '#64748B', fontSize: 11 }} 
                        axisLine={false} 
                        tickLine={false} 
                     />
                     <YAxis 
                        tick={{ fill: '#64748B', fontSize: 11 }} 
                        tickFormatter={(val) => `${Math.round(val / 10000).toLocaleString()}`}
                        axisLine={false} 
                        tickLine={false} 
                        width={55}
                     />
                     <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(27, 79, 138, 0.05)' }} />
                     {/* Kachi-iro Primary Bar */}
                     <Bar dataKey="price" fill="#1B4F8A" radius={[3, 3, 0, 0]} maxBarSize={36} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* Chart 2: Transaction Scatter Plot */}
      <div className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs">
        <div className="bg-slate-50/75 dark:bg-[#0D1117]/60 p-3.5 border-b border-slate-200/90 dark:border-slate-800/90">
           <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             <span>{pref}{city} {propertyType}の取引履歴プロット (面積×価格)</span>
           </h3>
        </div>
        
        <div className="p-4 sm:p-5">
           <div className="mb-4">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                取引平均価格 / 平均面積 (単価) (2023年基準)
              </p>
              <div className="flex items-baseline gap-1 font-bold text-slate-900 dark:text-slate-100">
                 <span className="text-2xl font-bold tabular-nums text-[#1B4F8A] dark:text-blue-400">
                   {avgPrice.toLocaleString('ja-JP')}
                 </span>
                 <span className="text-xs text-slate-500 mr-2">万円</span>
                 <span className="text-lg tabular-nums">/ {avgArea}㎡</span>
                 <span className="text-xs text-slate-500 ml-1 tabular-nums">({avgSqmPrice}万円/㎡)</span>
              </div>
           </div>

           <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                   <XAxis 
                      type="number" 
                      dataKey="area" 
                      name="面積" 
                      unit="㎡" 
                      tick={{ fill: '#64748B', fontSize: 11 }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={['auto', 'auto']}
                   />
                   <YAxis 
                      type="number" 
                      dataKey="priceMan" 
                      name="価格" 
                      tick={{ fill: '#64748B', fontSize: 11 }} 
                      tickFormatter={(val) => `${val.toLocaleString()}万`}
                      axisLine={false} 
                      tickLine={false} 
                      width={55}
                   />
                   <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                   {/* Slate Indigo Dot Scatter, Anti-AI Gimmick */}
                   <Scatter name="取引実績" data={scatterData} fill="#1B4F8A" fillOpacity={0.65} />
                 </ScatterChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
