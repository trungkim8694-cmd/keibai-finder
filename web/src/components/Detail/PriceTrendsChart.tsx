'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';

interface PriceTrendsChartProps {
  data: { year: string; price: number }[];
  city?: string;
  propertyType?: string;
}

export function PriceTrendsChart({ data, city, propertyType }: PriceTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full">
         <div className="flex items-center gap-2 mb-4">
          <LineChartIcon className="w-5 h-5 text-zinc-400" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center gap-1.5">
            価格推移 (過去5年)
            {city && propertyType && <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md whitespace-nowrap">{city} ({propertyType})</span>}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
           データがありません
        </div>
      </section>
    );
  }

  // Format Y-axis to Man-yen
  const formatYAxis = (tickItem: number) => {
    return `${Math.round(tickItem / 10000)}万`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const area = payload[0].payload.area;
      return (
        <div className="bg-zinc-900 dark:bg-zinc-800 text-white text-xs p-3 rounded-lg shadow-xl border border-zinc-700">
          <p className="font-bold mb-1 opacity-60">{`${label}年 平均取引額`}</p>
          <p className="text-lg font-black text-emerald-400 mb-0.5">
             {`${Math.round(val / 10000).toLocaleString('ja-JP')}万円`}
          </p>
          {area > 0 && (
            <p className="text-[10px] text-zinc-400">
               面積: 約{Math.round(area)}㎡
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <LineChartIcon className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center gap-1.5 border-b-0">
          価格推移 (過去5年)
          {city && propertyType && <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md whitespace-nowrap">{city} ({propertyType})</span>}
        </h3>
      </div>
      
      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" strokeOpacity={0.2} />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
